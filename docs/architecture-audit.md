# Auditoría de Arquitectura — `apps/nexus`

**Alcance:** `apps/nexus/src` completo (4 módulos, 150 archivos)
**Fecha:** 2026-08-07 · **Rama:** `develop`
**Puntaje:** 28/36 al auditar → **34/36 tras la remediación**
**Método:** skill `hexagonal-architecture`, modo AUDIT
**Estado:** los 3 HIGH, los 8 MEDIUM y los LOW están cerrados (excepto lo marcado como pendiente a
propósito). El detalle de cada fix está bajo su hallazgo.

---

## Resumen

La arquitectura hexagonal está **bien implementada en lo estructural**: cero fugas de framework en
`domain/` (verificado por grep), todos los puertos son `abstract class` correctamente bindeados en
los módulos, el dominio y la persistencia están separados por mappers en los cuatro módulos, y
`OkrTaskService` está registrado con `useFactory` para mantener el dominio libre de Nest. El
acoplamiento entre módulos es de manual: `daily` → `notification` pasa por un use case exportado
envuelto en `DailyTaskNotifier`, un anticorrupción de libro.

La debilidad no está en las fronteras sino en **lo que pasa cuando algo falla**. Tres caminos de
error pierden datos o fallos en silencio, y hay un handler de eventos que nunca se cableó. Sumado a
eso, la deriva de nombres entre `daily` (el módulo viejo) y `okr` (el refinado) ya es visible.

## Puntajes por dimensión

| Dimensión | Puntaje | Nota |
|---|---|---|
| Dirección de dependencias | 2/3 | `ConfigService` y excepción HTTP en un use case |
| Fronteras de módulo | 3/3 | — |
| Riqueza del dominio | 2/3 | reglas de progreso y visibilidad viven en use cases |
| Puertos y bindings | 3/3 | ejemplar |
| Granularidad de use cases | 3/3 | — |
| Adaptadores delgados | 3/3 | — |
| Aislamiento de mapeo | 3/3 | — |
| **Manejo de errores** | **1/3** | jerarquía excelente, aplicación inconsistente |
| **Consistencia de nombres** | **1/3** | `daily` y `okr` divergen |
| Higiene del shared kernel | 3/3 | solo `utils/` muerto |
| Acoplamiento entre módulos | 3/3 | anticorrupción correcto |
| **Testabilidad** | **1/3** | estructura ideal, 1 spec placeholder |

---

## Hallazgos

### [HIGH] ✅ RESUELTO — Un Key Result sin objetivo revienta el arranque y deja Mongo vacío en silencio

- **Dónde:** `okr/infrastructure/adapters/notion/notion-key-result.mapper.ts:18`
- **Regla rota:** las lecturas externas degradan; los VO nullables usan `createOrNull`
- **Por qué duele:** `Uuid.create(...?.[0]?.id)` recibía `undefined` cuando el KR no tenía objetivo y
  lanzaba `Invalid UUID` — pero `KeyResult.objectiveId` está declarado `Nullable<Uuid>`, o sea que el
  caso es legítimo. Peor: en `notion-key-result.provider.ts` el `catchError` estaba antes del `map`,
  así que el error se lanzaba **después** del operador que debía atraparlo. En `fetchAll` el `map`
  final no tenía `catchError` detrás. Resultado: `SetupOkrUsecase` explotaba al arrancar,
  `SetupOkrBootstrap` lo capturaba y logueaba, y la app quedaba corriendo **con cero key results
  persistidos**.
- **Fix aplicado:** `Uuid.createOrNull(... ?? null)`; `catchError` movido después del `map` en
  `fetchById`; `catchError` agregado tras el `map` final de `fetchAll` con código
  `MAP_OKR_KEY_RESULTS_FAILED`.

### [HIGH] ✅ RESUELTO — El handler de eventos de Key Result no estaba cableado

- **Dónde:** `okr/infrastructure/adapters/events/okr-key-result.event-handler.ts:11`
- **Regla rota:** todo adaptador de entrada se registra en `providers`
- **Por qué duele:** la clase se llamaba `OkrTaskEvent` — el mismo nombre que la de
  `okr-task.event-handler.ts` — no estaba en `events/index.ts` ni en los `providers` de `OkrModule`.
  Los webhooks de Key Result de Notion **nunca se procesaban**; toda la propagación de objetivos vía
  `SyncOkrKeyResultUsecase` estaba muerta. Además el `match(...)` no se esperaba, así que los
  rechazos escapaban del `try/catch`.
- **Fix aplicado:** renombrada a `OkrKeyResultEventHandler`, exportada en el barrel, registrada en
  `OkrModule`, `await match(...)`.
- **Queda abierto:** `PAGE_DELETED` llama a `propagateObjectiveUsecase` en vez de limpiar la relación.
  Es una decisión de negocio, no se tocó.

### [HIGH] ✅ RESUELTO — Una notificación que falla marca la tarea como notificada igual

- **Dónde:** `daily/infrastructure/adapters/notifier/daily-task-notifier.ts:20-22`,
  `notification/infrastructure/adapters/notifiers/discord.notifier.service.ts`,
  `daily/application/usecases/notify-daily-task.usecase.ts`
- **Regla rota:** las escrituras externas lanzan excepción tipada; nunca se traga un fallo
- **Por qué duele:** `sendNotificationUsecase.execute(notification)` no se espera y acto seguido se
  loguea `"Notification sent for task..."` incondicionalmente. Río abajo, `DiscordNotifierService.notify`
  atrapa todo y retorna `void`. El use case entonces hace `task.notify()` + `save()`, persistiendo el
  stage. Una caída de Discord produce logs que dicen "enviado", tareas marcadas como notificadas, y el
  recordatorio nunca se vuelve a intentar.
- **Fix aplicado:** nueva `NotificationDeliveryException extends ExternalServiceException`
  (`notification/application/exceptions/`) con `code: 'NOTIFICATION_DELIVERY_FAILED'`, contexto
  `{ provider, title, reason }` y `cause`. Discord y Pushover ahora lanzan en vez de tragar (Pushover
  pasó de `.subscribe()` fire-and-forget a `lastValueFrom`); `NotifierPort.notify` se estrechó a
  `Promise<void>`; `SendNotificationUsecase.execute` es `async` y espera al notificador;
  `DailyTaskNotifier` espera antes de loguear; `NotifyDailyTaskUsecase` envuelve cada tarea en
  try/catch, loguea con `ErrorLogFormatter` y `continue` — solo marca `task.notify()` + `save()` tras
  una entrega exitosa.
- **Cambios de soporte:** `ExternalServiceException.code` pasó de `readonly code = '...'` a
  `readonly code: string = '...'` — el tipo literal inferido impedía que cualquier subclase declarara
  su propio código (`NotFoundException` ya estaba anotada así). Y `ErrorLogFormatter` se movió de
  `shared/infrastructure/logging` a `shared/application/logging`: solo depende de `BaseException`, y
  desde infrastructure no podía usarlo un use case sin romper la dirección de dependencias.

---

### [MEDIUM] ✅ RESUELTO — Deref de null en `SyncOkrTaskStatusUsecase`

`okr/application/usecases/sync-okr-task-status.usecase.ts:11-13` — `fetchById` devuelve
`Nullable<OkrTask>` y se accedía `task.status` sin guarda. **Fix aplicado:** guard clause `if (!task) return;`.

### [MEDIUM] ✅ RESUELTO — `DailyTaskRepository.findById` miente en su tipo

`daily/domain/daily-task/daily-task.repository.ts:9` declara `Promise<DailyTask>` pero
`mongodb-daily-task.repository.ts` devuelve `null`. `RemoveDailyTaskUsecase` hace `remove(task)` sobre
ese valor sin verificar. `SetupDailyTaskUsecase` sí lo chequea — o sea que el propio código no le cree
al tipo. **Fix aplicado:** `Promise<Nullable<DailyTask>>` en el puerto y en el adaptador Mongo, guarda
en `RemoveDailyTaskUsecase`, y `DailyTask.notifiedAt` pasó de `DateTime | null` a `Nullable<DateTime>`.

### [MEDIUM] ✅ RESUELTO — `Uuid` lanza `Error` crudo

`shared/domain/value-objects/uuid.vo.ts:9` — es el único `throw new Error(` del proyecto, y está en el
shared kernel que define la jerarquía. Ese error llega al `ErrorLogFormatter` como `UNEXPECTED_ERROR`
sin contexto. **Fix aplicado:** `InvalidUuidError extends DomainException` con `code: 'INVALID_UUID'` y
`context: { value }`, en `shared/domain/exception/`.

### [MEDIUM] ✅ RESUELTO — Config y excepción HTTP dentro de un use case

`notification/application/usecases/send-notification.usecase.ts:1,18,23,32` — lee
`NOTIFICATION_PROVIDER` y `NOTIFICATION_TTL` de `ConfigService`, y lanza el `NotFoundException` de
`@nestjs/common`, que es un concepto HTTP. Es la única fuga de la capa de aplicación en todo el
proyecto. **Fix aplicado:** nuevo puerto `NotificationDefaults` (abstract class en
`application/ports/`) resuelto desde config por `NotificationDefaultsFactory` en infrastructure y
bindeado en `NotificationModule`; el `NotFoundException` de Nest se reemplazó por
`NotifierNotFoundError extends NotFoundException` del shared kernel de dominio.

### [MEDIUM] ✅ RESUELTO — `DailyTaskEvent` se cae con cualquier webhook sin `parent`

`daily/infrastructure/adapters/events/daily-task.event.ts:24` — `event.data.parent.data_source_id` sin
optional chaining. El handler de `okr` sí usa `event.data?.parent?.data_source_id`. Además usa un mapa
de objetos en vez de `match().exhaustive()`, así que un tipo de evento nuevo pasa sin ruido.
**Fix aplicado:** reescrito como `DailyTaskEventHandler` siguiendo el patrón de `okr` — datasource
resuelto en el constructor, optional chaining, `match().exhaustive()` y log con `ErrorLogFormatter`.

### [MEDIUM] ✅ RESUELTO — Un fallo corta el lote completo de notificaciones

`daily/application/usecases/notify-daily-task.usecase.ts` — el `for` no tenía try/catch por tarea. Una
tarea problemática impedía notificar todas las siguientes de esa corrida. **Fix aplicado** junto con el
HIGH de notificaciones.

### [MEDIUM] ✅ RESUELTO — Reglas de negocio fuera del dominio

`sync-okr-task-status.usecase.ts` fijaba los valores de progreso `0.1` y `1`, y
`visibility-daily-task.usecase.ts:4` definía `HOURS_TO_HIDE = 48`. **Fix aplicado:** `OkrTask` expone
`syncProgressWithStatus()` con sus constantes `STARTED_PROGRESS`/`COMPLETED_PROGRESS` privadas — el use
case quedó en tres líneas; `DailyTask.mustBeVisible()` ya no recibe las horas, usa su
`VISIBILITY_WINDOW_HOURS` interna.

### [MEDIUM] ✅ RESUELTO — `save` sin `await` y entidades importando su propio barrel

`okr/domain/okr-task/okr-task.service.ts:40` — la rama `[nullish, nullish]` no espera el `save`. Y
`daily-task.entity.ts:7` importa desde `@daily/domain`, `okr-task.entity.ts:4` desde
`@okr/domain/okr-task`: ambas entidades importan el barrel que las contiene, riesgo de ciclo en frío.

---

### [LOW] — deriva y residuos · ✅ RESUELTOS (salvo lo indicado)

- **Nombres divergentes `daily` vs `okr`** → alineados con `okr`:
  `daily-task.event.ts`/`DailyTaskEvent` → `daily-task.event-handler.ts`/`DailyTaskEventHandler`;
  `setup-daily-task.service.ts`/`SetupDailyTaskService` → `setup-daily-task.bootstrap.ts`/`SetupDailyTaskBootstrap`
  (ahora con try/catch + `ErrorLogFormatter`, como `SetupOkrBootstrap`);
  `purge-daily-task-usecase.ts` → `purge-daily-task.usecase.ts`;
  `DailyTaskProviderPort` → `DailyTaskDataSourcePort` (`daily-task-data-source.port.ts`).
- **`notification` no usaba su alias** → los 11 imports `../../../` pasaron a `@notification/*`.
- **Barrels** → `mongodb-daily-task.mapper` exportado; `retrieve-daily-task.usecase` deduplicado;
  `daily/application/exceptions/` eliminado.
- **Código muerto** → `shared/infrastructure/utils/` y `NotificationResponse` eliminados.
  **Pendiente a propósito:** `KeyResultRepository.findById/findAll/remove` siguen ahí. Borrar métodos
  de persistencia que funcionan es una decisión de producto, no un arreglo de arquitectura, y se
  re-agregan en un commit; se deja a criterio del dueño del módulo.
- **Tipos** → `NotifierFactory` devuelve `Notifiers` (`Map<NotifierTypes, NotifierPort>`);
  `app.get(ConfigService)` sin `any`; `notifiedAt: Nullable<DateTime>`; `setProgress(progress: number)`;
  `NotionEventInput.data` dejó de ser `Record<any, any>` y declara `parent?.data_source_id`.
- **Tests** → el placeholder se reemplazó por dos tests reales del scheduler. Además se destapó que
  **`nx test` nunca corrió**: `tsconfig.spec.json` no tenía los path aliases, así que cualquier spec
  que tocara un archivo con `@daily/*` fallaba a compilar. Se agregaron los `paths` ahí y el
  `moduleNameMapper` en `jest.config.ts` (que además tenía `displayName: 'notification'`, nombre
  previo de la app).
- **`docs/ARCHITECTURE.md`** → corregidas las tres rutas de módulo obsoletas.

---

## Nota sobre la ubicación de los puertos

`daily` declara sus puertos en `application/ports/` y `okr` en `domain/<agregado>/`. **No es una
inconsistencia**: bajo la regla de la skill (ubicación según el consumidor), `daily` no tiene domain
service y sus puertos los consumen solo los use cases, así que `application/ports/` es lo correcto.
La única deriva real ahí es el nombre (`Provider` vs `DataSource`), listada en LOW.

---

## Plan priorizado

1. ~~**Arreglar el mapper de Key Result** y agregar la guarda de null en `SyncOkrTaskStatusUsecase`.~~ ✅
2. ~~**Cablear `OkrKeyResultEventHandler`**: renombrar, exportar, registrar, `await`.~~ ✅
3. ~~**Cerrar el camino de notificación**: `await` en `DailyTaskNotifier`, excepción tipada desde
   Discord, marcar la tarea solo tras éxito, try/catch por tarea en el use case.~~ ✅
4. ~~**`InvalidUuidError`** en el shared kernel y `findById` devolviendo `Nullable<T>` en `daily`.~~ ✅
5. ~~**Pasada de consistencia de nombres** sobre `daily` + alias en `notification` + limpieza de barrels
   y código muerto.~~ ✅

**Puntaje tras la remediación: 34/36.** Los dos puntos que faltan son de testabilidad: el pipeline de
tests ya funciona y hay una plantilla, pero la cobertura real sigue siendo mínima. Ese es el siguiente
trabajo natural — empezar por `DailyTask.shouldNotify()` y `OkrTaskService.execObjectiveSync()`, que
concentran la lógica de negocio del proyecto.

---

## Hallazgo adicional (surgido al escribir los tests)

### [MEDIUM] ✅ RESUELTO — Providers de Notion leyendo config en inicializadores de campo

`notion-okr-task.provider.ts:17-21` y `notion-key-result.provider.ts:16-17` inicializaban sus campos
con `this.configService.get(...)`. Los inicializadores de campo corren **antes** de que se asignen las
propiedades del constructor, así que `this.configService` puede ser `undefined`. Hoy no explota solo
porque `tsconfig.app.json` fija `target: es2021`; con `es2022+` (`useDefineForClassFields`) —el target
de `tsconfig.base.json` es `es2024`— reventaría en runtime al instanciar el provider. TypeScript ya lo
marcaba (TS2729) pero nadie compilaba esos archivos con el tsconfig heredado hasta que las specs
empezaron a hacerlo.

**Fix aplicado:** las lecturas se movieron al cuerpo del constructor, como ya hacían
`OkrTaskEventHandler` y `DailyTaskEventHandler`.

---

## Estado del build

- `tsc -p apps/nexus/tsconfig.app.json --noEmit`: **limpio**.
- `nx lint nexus`: **verde**. Los 5 errores que existían antes de la auditoría quedaron cerrados
  (`no-empty-function` ×3, `Function` en `properties-only.type.ts`, `Object` en
  `notion-event.input.dto.ts`).
- `nx test nexus`: **verde, 76 tests en 12 suites**. Antes el target estaba roto por configuración
  (faltaban los `paths` en `tsconfig.spec.json`), no por código. También hizo falta
  `transformIgnorePatterns` para `uuid` v13, que es ESM puro.
- `nx build nexus` (webpack, producción): **verde**.

### Cobertura añadida

| Suite | Qué cubre |
|---|---|
| `daily-task.entity.spec.ts` | ventanas de notificación, stages, tareas vencidas, visibilidad 48h |
| `okr-task.entity.spec.ts` | `syncProgressWithStatus` incluida su idempotencia |
| `okr-task.service.spec.ts` | las 4 ramas de `execObjectiveSync` + task ausente en el source |
| `notify-daily-task.usecase.spec.ts` | **una entrega fallida no marca la tarea ni corta el lote** |
| `notion-key-result.mapper.spec.ts` | **regresión del bug de arranque**: KR sin objetivo → `null` |
| `send-notification.usecase.spec.ts` | defaults, provider desconocido, propagación del fallo |
| `sync-okr-task-status.usecase.spec.ts` | guarda de null y no-escritura cuando no hay cambio |
| `okr.module.spec.ts` | **regresión**: ambos event handlers registrados; todos los puertos bindeados |
| `task.module.spec.ts` | puertos y adaptadores de entrada de `daily` resueltos |
| `uuid.vo.spec.ts`, `error-log.formatter.spec.ts` | contratos del shared kernel |

Los dos tests de regresión se verificaron revirtiendo el fix: sin él, fallan.

### Verificación de arranque

`node dist/apps/nexus/main.js` inicializa `AppModule`, `ConfigModule`, `CacheModule`, `ScheduleModule`,
`EventEmitterModule`, hace login real del bot de Discord (`Notifier#6200`) e inicializa
`NotificationModule` — es decir, **el wiring nuevo de `NotificationDefaults` resuelve en la app real**.
Se detiene en `MongooseModule` con `ECONNREFUSED 127.0.0.1:27017`: **no hay MongoDB en esta máquina**
(tampoco Docker corriendo), así que `SharedModule`, `TaskModule` y `OkrModule` no llegan a inicializarse
por esa vía. Su cableado queda cubierto por los dos `*.module.spec.ts`.

### Qué sigue SIN verificar

Ningún camino de integración real —Notion, Mongo, Discord, Pushover— fue ejercitado de punta a punta.
Para cerrarlo hay que levantar MongoDB y arrancar la app: la señal concreta es que las colecciones
`okr_tasks` y `okr_key_results` se pueblen al inicializar, que es exactamente lo que el bug del mapper
impedía.
