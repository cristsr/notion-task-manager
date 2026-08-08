# Arquitectura del Proyecto Notifier

## Documento Tecnico de Especificacion Arquitectonica

Este documento describe la arquitectura del proyecto **Notifier**, diseñado para ser replicable en otros proyectos. La arquitectura sigue los principios de Clean Architecture, DDD (Domain-Driven Design) y el patron Hexagonal (Ports & Adapters).

---

## Tabla de Contenidos

1. [Vision General](#1-vision-general)
2. [Estructura de Carpetas](#2-estructura-de-carpetas)
3. [Capas de la Arquitectura](#3-capas-de-la-arquitectura)
4. [Patrones de Diseno](#4-patrones-de-diseno)
5. [Inyeccion de Dependencias](#5-inyeccion-de-dependencias)
6. [Casos de Uso (Use Cases)](#6-casos-de-uso-use-cases)
7. [Repositorios y Adaptadores](#7-repositorios-y-adaptadores)
8. [Configuracion y Bootstrap](#8-configuracion-y-bootstrap)
9. [Internacionalizacion (i18n)](#9-internacionalizacion-i18n)
10. [Guia de Implementacion](#10-guia-de-implementacion)

---

## 1. Vision General

### 1.1 Principios Arquitectonicos

| Principio              | Descripcion                                           |
| ---------------------- | ----------------------------------------------------- |
| **Clean Architecture** | Separacion de responsabilidades en capas concentricas |
| **DDD**                | Modelado del dominio como nucleo de la aplicacion     |
| **Hexagonal**          | Puertos y adaptadores para desacoplar infraestructura |
| **SOLID**              | Principios de diseno orientado a objetos              |
| **Event-Driven**       | Comunicacion asincrona mediante eventos               |

### 1.2 Stack Tecnologico

- **Framework**: NestJS
- **Lenguaje**: TypeScript
- **Base de Datos**: MongoDB + Mongoose
- **Programacion Reactiva**: RxJS
- **Internacionalizacion**: i18next
- **Fechas**: Luxon

### 1.3 Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ Controllers │ │  Schedulers │ │ External Services       ││
│  │ (HTTP)      │ │  (Cron)     │ │ (Notion, Discord, etc.) ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ Repositories│ │   Events    │ │ Mappers (Infra)         ││
│  │ (MongoDB)   │ │  Listeners  │ │                         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                     APPLICATION                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │  Use Cases  │ │    DTOs     │ │ Ports (Abstractions)    ││
│  │             │ │ Input/Output│ │                         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────┐ ┌─────────────┐                            │
│  │   Mappers   │ │    Types    │                            │
│  │ (App Layer) │ │             │                            │
│  └─────────────┘ └─────────────┘                            │
├─────────────────────────────────────────────────────────────┤
│                       DOMAIN                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │  Entities   │ │Value Objects│ │ Repository Abstractions ││
│  │             │ │             │ │                         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────┐                                            │
│  │    Enums    │                                            │
│  │             │                                            │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Estructura de Carpetas

### 2.1 Estructura Base por Modulo

```
src/
├── app.module.ts                    # Modulo raiz
├── main.ts                          # Bootstrap de la aplicacion
├── shared/                          # Codigo compartido (transversal)
│   ├── application/
│   │   └── ports/                   # Puertos compartidos
│   ├── domain/
│   │   └── value-objects/           # Value Objects reutilizables
│   └── infrastructure/
│       ├── adapters/
│       │   └── http/                # Controladores compartidos
│       ├── config/                  # Configuracion de servicios externos
│       ├── decorators/              # Decoradores personalizados
│       ├── dtos/                    # DTOs compartidos
│       ├── guards/                  # Guards de autenticacion
│       ├── types/                   # Tipos compartidos
│       └── shared.module.ts
│
├── [module-name]/                   # Modulo de dominio
│   ├── application/
│   │   ├── dto/
│   │   │   ├── [entity].input.dto.ts
│   │   │   ├── [entity].output.dto.ts
│   │   │   └── index.ts
│   │   ├── mappers/
│   │   │   └── [entity].mapper.ts
│   │   ├── ports/
│   │   │   ├── [port-name].port.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   └── [module].types.ts
│   │   └── usecases/
│   │       ├── [action]-[entity].usecase.ts
│   │       └── index.ts
│   ├── domain/
│   │   ├── [entity]/
│   │   │   ├── [entity].entity.ts
│   │   │   ├── [entity].enum.ts
│   │   │   └── [entity].repository.ts
│   │   └── index.ts
│   └── infrastructure/
│       ├── adapters/
│       │   ├── bootstrap/           # Inicializacion del modulo
│       │   ├── events/              # Listeners de eventos
│       │   ├── http/                # Controladores HTTP
│       │   ├── notifier/            # Adaptadores de notificacion
│       │   ├── persistence/         # Implementaciones de repositorios
│       │   │   └── mongodb/
│       │   │       └── [entity]/
│       │   │           ├── mongodb-[entity].entity.ts
│       │   │           ├── mongodb-[entity].mapper.ts
│       │   │           └── mongodb-[entity].repository.ts
│       │   └── schedulers/          # Tareas programadas
│       ├── config/                  # Factories de configuracion
│       └── [module].module.ts
```

### 2.2 Convencion de Nombres de Archivos

| Tipo                         | Patron                         | Ejemplo                            |
| ---------------------------- | ------------------------------ | ---------------------------------- |
| Entidad                      | `[name].entity.ts`             | `daily-task.entity.ts`             |
| Repositorio (Abstraccion)    | `[name].repository.ts`         | `daily-task.repository.ts`         |
| Repositorio (Implementacion) | `mongodb-[name].repository.ts` | `mongodb-daily-task.repository.ts` |
| Use Case                     | `[action]-[entity].usecase.ts` | `notify-daily-task.usecase.ts`     |
| DTO Input                    | `[name].input.dto.ts`          | `daily-task.input.dto.ts`          |
| DTO Output                   | `[name].output.dto.ts`         | `daily-task.output.dto.ts`         |
| Mapper                       | `[name].mapper.ts`             | `daily-task.mapper.ts`             |
| Port                         | `[name].port.ts`               | `daily-task-provider.port.ts`      |
| Enum                         | `[name].enum.ts`               | `daily-task.enum.ts`               |
| Value Object                 | `[name].vo.ts`                 | `uuid.vo.ts`                       |
| Factory                      | `[name].factory.ts`            | `notion-client.factory.ts`         |
| Guard                        | `[name].guard.ts`              | `basic-auth.guard.ts`              |
| Controller                   | `[name].controller.ts`         | `daily-task.controller.ts`         |
| Scheduler                    | `[name].scheduler.ts`          | `daily-task.scheduler.ts`          |

---

## 3. Capas de la Arquitectura

### 3.1 Domain Layer (Capa de Dominio)

La capa de dominio contiene la logica de negocio pura, sin dependencias externas.

#### 3.1.1 Entidades de Dominio

```typescript
// src/[module]/domain/[entity]/[entity].entity.ts

export class DailyTask {
  id: Uuid;
  title: string;
  date: DateTime;
  status: DailyTaskStatus;
  priority: DailyTaskPriority;
  notificationStages: DailyNotificationStage[];
  notifiedAt: DateTime | null;

  // Constructor privado - usa factory method
  private constructor(payload?: Partial<DailyTask>) {
    Object.assign(this, payload);
  }

  // Factory method para crear instancias
  static create(payload: PropertiesOnly<DailyTask>): DailyTask {
    return new DailyTask(payload);
  }

  // Metodos de dominio con logica de negocio
  shouldNotify(): boolean {
    const now = DateTime.local();
    const diff = this.date.diff(now);

    if (!(now.hour >= 8 && now.hour < 24)) return false;

    if (diff.as('minutes') <= 15) {
      return !this.notificationStages.includes(DailyNotificationStage.BEFORE_15_MINUTES);
    }
    // ... mas logica de dominio
    return false;
  }

  notify(): void {
    const stage = this.getNotificationStage();
    this.notificationStages.push(stage);
    this.notifiedAt = DateTime.local();
  }

  isDone(): boolean {
    return this.status === DailyTaskStatus.DONE;
  }
}
```

#### 3.1.2 Value Objects

```typescript
// src/shared/domain/value-objects/uuid.vo.ts

export class Uuid {
  private constructor(public readonly value: string) {}

  static create(value: string): Uuid {
    if (!validate(value)) {
      throw new Error('Invalid UUID');
    }
    return new Uuid(value);
  }

  static generate(): Uuid {
    return new Uuid(crypto.randomUUID());
  }

  equals(other: Uuid): boolean {
    return this.value === other.value;
  }
}
```

#### 3.1.3 Enumeraciones de Dominio

```typescript
// src/[module]/domain/[entity]/[entity].enum.ts

export enum DailyTaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum DailyTaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum DailyNotificationStage {
  BEFORE_24_HOURS = 'BEFORE_24_HOURS',
  BEFORE_1_HOUR = 'BEFORE_1_HOUR',
  BEFORE_15_MINUTES = 'BEFORE_15_MINUTES',
  AFTER_NOW = 'AFTER_NOW',
}
```

#### 3.1.4 Abstraccion de Repositorio

```typescript
// src/[module]/domain/[entity]/[entity].repository.ts

export abstract class DailyTaskRepository {
  abstract getAllTask(): Promise<DailyTask[]>;
  abstract save(task: DailyTask): Promise<void>;
  abstract insert(task: DailyTask): Promise<void>;
  abstract updateVisibility(task: DailyTask): Promise<void>;
  abstract findById(id: Uuid): Promise<DailyTask | null>;
  abstract remove(task: DailyTask): Promise<void>;
}
```

### 3.2 Application Layer (Capa de Aplicacion)

La capa de aplicacion orquesta los casos de uso y define los contratos (puertos).

#### 3.2.1 Puertos (Abstracciones)

```typescript
// src/[module]/application/ports/[name].port.ts

// Puerto para proveedor externo
export abstract class DailyTaskProviderPort {
  abstract fetchPendingTasks(): Promise<DailyTask[]>;
  abstract fetchById(id: Uuid): Promise<DailyTask>;
  abstract updateVisibility(task: DailyTask): Promise<void>;
}

// Puerto para notificador
export abstract class DailyTaskNotifierPort {
  abstract notify(task: DailyTask): Promise<void>;
}

// Puerto con token de inyeccion
export const NOTIFIERS = 'NOTIFIERS';

export abstract class NotifierPort {
  abstract readonly instance: NotifierTypes;
  abstract notify(payload: Notification): Promise<void> | void;
}
```

#### 3.2.2 Casos de Uso

```typescript
// src/[module]/application/usecases/[action]-[entity].usecase.ts

@Injectable()
export class NotifyDailyTaskUsecase {
  constructor(
    private readonly taskRepository: DailyTaskRepository,
    private readonly taskNotifier: DailyTaskNotifierPort,
  ) {}

  async execute(): Promise<void> {
    const tasks = await this.taskRepository.getAllTask();

    for (const task of tasks) {
      if (!task.shouldNotify()) continue;

      await this.taskNotifier.notify(task);
      task.notify();
      await this.taskRepository.save(task);
    }
  }
}
```

#### 3.2.3 DTOs

```typescript
// src/[module]/application/dto/[entity].output.dto.ts

export class DailyTaskOutput {
  @IsUUID('4')
  id: string;

  @IsString()
  title: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsIn(Object.values(DailyTaskPriority))
  priority: DailyTaskPriority;

  @IsBoolean()
  hidden: boolean;

  url: string;

  constructor(payload: DailyTaskOutput) {
    Object.assign(this, payload);
  }
}
```

#### 3.2.4 Mappers de Aplicacion

```typescript
// src/[module]/application/mappers/[entity].mapper.ts

export class DailyTaskMapper {
  static toDTO(task: DailyTask): DailyTaskOutput {
    return new DailyTaskOutput({
      id: task.id.value,
      title: task.title,
      date: task.date.toISO(),
      priority: task.priority,
      status: task.status,
      hidden: task.hidden,
      url: task.url,
    });
  }
}
```

### 3.3 Infrastructure Layer (Capa de Infraestructura)

La capa de infraestructura implementa los adaptadores concretos.

#### 3.3.1 Implementacion de Repositorio

```typescript
// src/[module]/infrastructure/adapters/persistence/mongodb/[entity]/mongodb-[entity].repository.ts

@Injectable()
export class MongodbDailyTaskRepository implements DailyTaskRepository {
  constructor(
    @InjectModel(MongodbDailyTaskEntity.name)
    private readonly taskEntity: Model<MongodbDailyTaskEntity>,
  ) {}

  async findById(id: Uuid): Promise<DailyTask | null> {
    const task = await this.taskEntity.findOne({ id: id.value }).exec();
    if (!task) return null;
    return MongodbDailyTaskMapper.toDomain(task);
  }

  async getAllTask(): Promise<DailyTask[]> {
    const tasks = await this.taskEntity.find().exec();
    return tasks.map(MongodbDailyTaskMapper.toDomain);
  }

  async insert(task: DailyTask): Promise<void> {
    await this.taskEntity.insertOne(MongodbDailyTaskMapper.toEntity(task));
  }

  async updateVisibility(task: DailyTask): Promise<void> {
    await this.taskEntity.updateOne({ id: task.id.value }, { $set: MongodbDailyTaskMapper.toEntity(task) });
  }

  async save(task: DailyTask): Promise<void> {
    const existTask = await this.findById(task.id);
    if (!existTask) {
      await this.insert(task);
    } else {
      await this.updateVisibility(task);
    }
  }

  async remove(task: DailyTask): Promise<void> {
    await this.taskEntity.deleteOne({ id: task.id.value }).exec();
  }
}
```

#### 3.3.2 Entidad de Infraestructura (Mongoose)

```typescript
// src/[module]/infrastructure/adapters/persistence/mongodb/[entity]/mongodb-[entity].entity.ts

@Schema({ collection: 'tasks' })
export class MongodbDailyTaskEntity {
  @Prop()
  id: string;

  @Prop(String)
  title: string;

  @Prop(Date)
  date: Date;

  @Prop(String)
  status: DailyTaskStatus;

  @Prop([String])
  notificationStages: string[];

  @Prop(Boolean)
  hidden: boolean;

  constructor(payload: MongodbDailyTaskEntity) {
    Object.assign(this, payload);
  }
}

export const TaskSchema = SchemaFactory.createForClass(MongodbDailyTaskEntity);

export const MongodbTaskEntityProvider: ModelDefinition = {
  name: MongodbDailyTaskEntity.name,
  schema: TaskSchema,
};
```

#### 3.3.3 Mapper de Infraestructura

```typescript
// src/[module]/infrastructure/adapters/persistence/mongodb/[entity]/mongodb-[entity].mapper.ts

export class MongodbDailyTaskMapper {
  static toEntity(task: DailyTask): MongodbDailyTaskEntity {
    return new MongodbDailyTaskEntity({
      id: task.id.value,
      date: task.date.toJSDate(),
      title: task.title,
      status: task.status,
      notificationStages: task.notificationStages,
      notifiedAt: task.notifiedAt?.toISO(),
      hidden: task.hidden,
    });
  }

  static toDomain(task: MongodbDailyTaskEntity): DailyTask {
    return DailyTask.create({
      id: Uuid.create(task.id),
      date: DateTime.fromJSDate(task.date),
      title: task.title,
      status: task.status,
      notificationStages: task.notificationStages as DailyNotificationStage[],
      notifiedAt: task.notifiedAt ? DateTime.fromISO(task.notifiedAt) : null,
      hidden: task.hidden,
    });
  }
}
```

#### 3.3.4 Controladores HTTP

```typescript
// src/[module]/infrastructure/adapters/http/[entity].controller.ts

@Controller('tasks')
export class DailyTaskController {
  constructor(
    private readonly notifyTaskUsecase: NotifyDailyTaskUsecase,
    private readonly retrieveTaskUsecase: RetrieveDailyTaskUsecase,
    private readonly syncTaskUsecase: SetupDailyTaskUsecase,
  ) {}

  @Get()
  getTasks() {
    return this.retrieveTaskUsecase.execute();
  }

  @Get('sync')
  syncTasks() {
    return this.syncTaskUsecase.execute();
  }

  @Get('notify')
  notifyTask() {
    return this.notifyTaskUsecase.execute();
  }
}
```

#### 3.3.5 Schedulers

```typescript
// src/[module]/infrastructure/adapters/schedulers/[entity].scheduler.ts

@Injectable()
export class DailyTaskScheduler {
  constructor(
    private readonly notifyTaskUsecase: NotifyDailyTaskUsecase,
    private readonly visibilityTaskUsecase: VisibilityDailyTaskUsecase,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async notifyTasks(): Promise<void> {
    await this.notifyTaskUsecase.execute();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async verifyTaskVisibility(): Promise<void> {
    await this.visibilityTaskUsecase.execute();
  }
}
```

#### 3.3.6 Event Listeners

```typescript
// src/[module]/infrastructure/adapters/events/event-[entity].service.ts

@Injectable()
export class DailyTaskEvent {
  constructor(
    private readonly synctTaskUsecase: SyncDailyTaskUsecase,
    private readonly removeTasksUsecase: RemoveDailyTaskUsecase,
  ) {}

  @OnEvent('notion.event')
  async onNotionEvent(event: NotionEventInput) {
    const eventHandlers = {
      [NotionEventType.PAGE_CREATED]: () => this.synctTaskUsecase.execute(Uuid.create(event.entity.id)),
      [NotionEventType.PAGE_DELETED]: () => this.removeTasksUsecase.execute(Uuid.create(event.entity.id)),
    };

    const handler = eventHandlers[event.type];
    if (handler) await handler();
  }
}
```

---

## 4. Patrones de Diseno

### 4.1 Factory Pattern

```typescript
// src/[module]/infrastructure/config/[service]/[service].factory.ts

export class NotionClientFactory {
  static getClient() {
    return (config: ConfigService) => {
      return new NotionClient({
        auth: config.get('NOTION_API_TOKEN'),
        logLevel: LogLevel.ERROR,
      });
    };
  }
}

// Uso en modulo
{
  provide: NotionClient,
  useFactory: NotionClientFactory.getClient(),
  inject: [ConfigService],
}
```

### 4.2 Strategy Pattern

```typescript
// Multiples estrategias de notificacion
export class DiscordNotifierService implements NotifierPort {
  readonly instance = NotifierTypes.DISCORD;
  async notify(payload: Notification): Promise<void> {
    /* ... */
  }
}

export class PushoverNotifierService implements NotifierPort {
  readonly instance = NotifierTypes.PUSHOVER;
  notify(payload: Notification): void {
    /* ... */
  }
}

// Factory para crear mapa de estrategias
export class NotifierFactory {
  static createNotifiers() {
    return (...providers: NotifierPort[]) => {
      return new Map<string, NotifierPort>(providers.map((p) => [p.instance, p]));
    };
  }
}
```

### 4.3 Repository Pattern

```typescript
// Abstraccion en Domain
export abstract class DailyTaskRepository {
  abstract getAllTask(): Promise<DailyTask[]>;
  abstract findById(id: Uuid): Promise<DailyTask | null>;
  abstract save(task: DailyTask): Promise<void>;
}

// Implementacion en Infrastructure
@Injectable()
export class MongodbDailyTaskRepository implements DailyTaskRepository {
  // Implementacion concreta
}
```

### 4.4 Mapper Pattern

```
Domain <---> Application DTO <---> Infrastructure Entity

DailyTaskMapper (Application): DailyTask -> DailyTaskOutput
MongodbDailyTaskMapper (Infra): DailyTask <-> MongodbDailyTaskEntity
NotionDailyTaskMapper (Infra): NotionResponse -> DailyTask
```

---

## 5. Inyeccion de Dependencias

### 5.1 Modulo de Dominio

```typescript
// src/[module]/[module].module.ts

@Module({
  imports: [NotificationModule, MongooseModule.forFeature([MongodbTaskEntityProvider])],
  controllers: [DailyTaskController],
  providers: [
    // Servicios de infraestructura
    DailyTaskScheduler,
    SetupDailyTaskService,
    DailyTaskEvent,

    // Use Cases
    NotifyDailyTaskUsecase,
    PurgeDailyTaskUsecase,
    RemoveDailyTaskUsecase,
    RetrieveDailyTaskUsecase,
    SetupDailyTaskUsecase,
    SyncDailyTaskUsecase,
    VisibilityDailyTaskUsecase,

    // Binding de abstracciones a implementaciones
    {
      provide: DailyTaskProviderPort,
      useClass: NotionDailyTaskProvider,
    },
    {
      provide: DailyTaskRepository,
      useClass: MongodbDailyTaskRepository,
    },
    {
      provide: DailyTaskNotifierPort,
      useClass: DailyTaskNotifier,
    },
  ],
})
export class TaskModule {}
```

### 5.2 Modulo Compartido

```typescript
// src/shared/shared.module.ts

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({ global: true }),
    MongooseModule.forRootAsync({
      useFactory: MongodbConnectionFactory.create(),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: EventEmitter,
      useExisting: EventEmitter2,
    },
    {
      provide: NotionClient,
      useFactory: NotionClientFactory.getClient(),
      inject: [ConfigService],
    },
    {
      provide: I18nService,
      useFactory: I18nFactory.create(),
      inject: [ConfigService],
    },
    {
      provide: APP_GUARD,
      useClass: BasicAuthGuard,
    },
  ],
  exports: [NotionClient, I18nService],
})
export class SharedModule {}
```

### 5.3 Tokens de Inyeccion Personalizados

```typescript
// Para colecciones o mapas de servicios
export const NOTIFIERS = 'NOTIFIERS';

// En modulo
{
  provide: NOTIFIERS,
  useFactory: NotifierFactory.createNotifiers(),
  inject: [DiscordNotifierService, PushoverNotifierService],
}

// Uso en clase
constructor(
  @Inject(NOTIFIERS)
  private readonly notifiers: Map<string, NotifierPort>,
) {}
```

---

## 6. Casos de Uso (Use Cases)

### 6.1 Estructura de un Use Case

```typescript
@Injectable()
export class [Action][Entity]Usecase {
  constructor(
    // Inyectar dependencias (repositorios, puertos, servicios)
    private readonly repository: EntityRepository,
    private readonly externalPort: ExternalPort,
  ) {}

  async execute(input?: InputDTO): Promise<OutputDTO | void> {
    // 1. Obtener datos del dominio
    const entities = await this.repository.getAll();

    // 2. Aplicar logica de negocio
    for (const entity of entities) {
      if (!entity.shouldProcess()) continue;

      // 3. Interactuar con servicios externos via puertos
      await this.externalPort.process(entity);

      // 4. Actualizar estado del dominio
      entity.markAsProcessed();

      // 5. Persistir cambios
      await this.repository.save(entity);
    }
  }
}
```

### 6.2 Catalogo de Use Cases del Proyecto

| Use Case                     | Responsabilidad                                      |
| ---------------------------- | ---------------------------------------------------- |
| `SetupDailyTaskUsecase`      | Sincronizar todas las tareas desde proveedor externo |
| `SyncDailyTaskUsecase`       | Sincronizar una tarea individual                     |
| `NotifyDailyTaskUsecase`     | Verificar y enviar notificaciones pendientes         |
| `VisibilityDailyTaskUsecase` | Gestionar visibilidad de tareas                      |
| `PurgeDailyTaskUsecase`      | Eliminar tareas obsoletas                            |
| `RemoveDailyTaskUsecase`     | Eliminar una tarea especifica                        |
| `RetrieveDailyTaskUsecase`   | Obtener todas las tareas (lectura)                   |
| `SendNotificationUsecase`    | Enviar notificacion via proveedor configurado        |

### 6.3 Flujos de Orquestacion

**Bootstrap (Inicializacion):**

```
SetupDailyTaskService.onModuleInit()
  -> SetupDailyTaskUsecase.execute()
  -> PurgeDailyTaskUsecase.execute()
  -> NotifyDailyTaskUsecase.execute()
```

**Scheduler (Cada minuto):**

```
DailyTaskScheduler.notifyTasks()
  -> NotifyDailyTaskUsecase.execute()
      -> taskRepository.getAllTask()
      -> task.shouldNotify() [logica de dominio]
      -> taskNotifier.notify(task)
      -> task.notify() [mutacion de dominio]
      -> taskRepository.save(task)
```

**Event-Driven (Webhook):**

```
NotionEventController.onEvent()
  -> EventEmitter.emit('notion.event')
      -> DailyTaskEvent.onNotionEvent()
          -> SyncDailyTaskUsecase | RemoveDailyTaskUsecase
```

---

## 7. Repositorios y Adaptadores

### 7.1 Patron de Repositorio

```
┌─────────────────────────────────────────┐
│           DailyTaskRepository                │
│          (Abstract Class)               │
│                                         │
│  + getAllTask(): Promise<DailyTask[]>        │
│  + findById(id: Uuid): Promise<DailyTask>    │
│  + save(task: DailyTask): Promise<void>      │
│  + insert(task: DailyTask): Promise<void>    │
│  + updateVisibility(task: DailyTask): Promise<void>    │
│  + remove(task: DailyTask): Promise<void>    │
└────────────────┬────────────────────────┘
                 │
                 │ implements
                 ▼
┌─────────────────────────────────────────┐
│       MongodbDailyTaskRepository             │
│       (Concrete Implementation)         │
│                                         │
│  - taskEntity: Model<MongodbDailyTaskEntity> │
│                                         │
│  + getAllTask(): Promise<DailyTask[]>        │
│  + findById(id: Uuid): Promise<DailyTask>    │
│  + save(task: DailyTask): Promise<void>      │
│  ...                                    │
└─────────────────────────────────────────┘
```

### 7.2 Patron de Adaptador (Provider)

```
┌─────────────────────────────────────────┐
│         DailyTaskProviderPort                │
│         (Abstract Class)                │
│                                         │
│  + fetchPendingTasks(): Promise<DailyTask[]>          │
│  + fetchById(id: Uuid): Promise<DailyTask>   │
│  + updateVisibility(task: DailyTask): Promise<void>    │
└────────────────┬────────────────────────┘
                 │
                 │ implements
                 ▼
┌─────────────────────────────────────────┐
│       NotionDailyTaskProvider                │
│       (Notion API Adapter)              │
│                                         │
│  - notionClient: NotionClient           │
│  - config: ConfigService                │
│                                         │
│  + fetchPendingTasks(): Promise<DailyTask[]>          │
│    [Paginacion + Reintentos con RxJS]   │
│  + fetchById(id: Uuid): Promise<DailyTask>   │
│  + updateVisibility(task: DailyTask): Promise<void>    │
└─────────────────────────────────────────┘
```

### 7.3 Estrategia de Mapeo entre Capas

```typescript
// Conversion: External API -> Domain
export class NotionDailyTaskMapper {
  static toDomain(input: PageObjectResponse): DailyTask {
    return DailyTask.create({
      id: Uuid.create(input.id),
      title: input.properties.Name['title'][0].text.content,
      status: StatusMap[input.properties['Status']['status'].name],
      date: DateTime.fromISO(input.properties['Date']['date'].start),
      // ... mapeo de propiedades
    });
  }
}

// Conversion: Domain <-> Persistence
export class MongodbDailyTaskMapper {
  static toEntity(task: DailyTask): MongodbDailyTaskEntity {
    /* ... */
  }
  static toDomain(entity: MongodbDailyTaskEntity): DailyTask {
    /* ... */
  }
}

// Conversion: Domain -> DTO (Response)
export class DailyTaskMapper {
  static toDTO(task: DailyTask): DailyTaskOutput {
    /* ... */
  }
}
```

---

## 8. Configuracion y Bootstrap

### 8.1 Bootstrap Principal

```typescript
// src/main.ts

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');

  const config = app.get<ConfigService>(ConfigService);

  // Configuracion global de timezone
  Settings.defaultZone = config.get('TIME_ZONE');

  const port = config.get('PORT');
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
```

### 8.2 Modulo Raiz

```typescript
// src/app.module.ts

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true }),
    HttpModule.register({ global: true }),
    ScheduleModule.forRoot(),
    SharedModule,
    TaskModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        always: true,
      }),
    },
  ],
})
export class AppModule {}
```

### 8.3 Inicializacion de Modulo (OnModuleInit)

```typescript
// src/[module]/infrastructure/adapters/bootstrap/setup-[entity].service.ts

@Injectable()
export class SetupDailyTaskService implements OnModuleInit {
  constructor(
    private readonly syncTaskUsecase: SetupDailyTaskUsecase,
    private readonly purgeTaskUsecase: PurgeDailyTaskUsecase,
    private readonly notifyTaskUsecase: NotifyDailyTaskUsecase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.syncTaskUsecase.execute();
    await this.purgeTaskUsecase.execute();
    await this.notifyTaskUsecase.execute();
  }
}
```

### 8.4 Factories de Configuracion

```typescript
// MongoDB
export class MongodbConnectionFactory {
  static create() {
    return async (config: ConfigService): Promise<MongooseModuleFactoryOptions> => ({
      uri: config.get('MONGO_DB_URI'),
      dbName: config.get('MONGO_DB_NAME'),
    });
  }
}

// Discord Client
export class DiscordClientFactory {
  static getClient() {
    return async (config: ConfigService) => {
      const client = new DiscordClient({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
      });
      await client.login(config.get('DISCORD_BOT_TOKEN'));
      return client;
    };
  }
}
```

---

## 9. Internacionalizacion (i18n)

### 9.1 Configuracion de i18n

```typescript
// src/shared/infrastructure/config/i18n/i18n.factory.ts

export class I18nFactory {
  static create() {
    return async (config: ConfigService): Promise<I18nService> => {
      const defaultLang = config.get('I18N_DEFAULT_LANG', 'es');

      await i18next.use(Backend).init({
        lng: defaultLang,
        fallbackLng: defaultLang,
        ns: ['task'],
        defaultNS: 'task',
        backend: {
          loadPath: join(__dirname, 'assets/i18n/{{lng}}/{{ns}}.json'),
        },
        interpolation: {
          escapeValue: false,
        },
      });

      return new I18nService(i18next);
    };
  }
}
```

### 9.2 Servicio i18n

```typescript
// src/shared/infrastructure/config/i18n/i18n.service.ts

export class I18nService {
  constructor(private readonly i18n: i18n) {}

  t(key: string, options?: Record<string, unknown>): string {
    return this.i18n.t(key, options);
  }

  changeLanguage(lang: string): Promise<void> {
    return this.i18n.changeLanguage(lang).then(() => undefined);
  }

  get language(): string {
    return this.i18n.language;
  }
}
```

### 9.3 Archivos de Traduccion

```
assets/
└── i18n/
    └── es/
        └── task.json
```

```json
{
  "notification": {
    "stages": {
      "BEFORE_24_HOURS": "Recordatorio: Tarea en 24 horas",
      "BEFORE_1_HOUR": "Recordatorio: Tarea en 1 hora",
      "BEFORE_15_MINUTES": "Recordatorio: Tarea en 15 minutos",
      "AFTER_NOW": "Alerta: Tarea vencida"
    },
    "endTime": "Hora de finalizacion: {{time}}",
    "urlTitle": "Ver tarea"
  }
}
```

### 9.4 Uso en Adaptadores

```typescript
@Injectable()
export class DailyTaskNotifier implements DailyTaskNotifierPort {
  constructor(
    private readonly sendNotificationUsecase: SendNotificationUsecase,
    private readonly i18n: I18nService,
  ) {}

  private formatNotification(task: DailyTask): NotificationInput {
    const stage = task.getNotificationStage();
    const stageLabel = this.i18n.t(`notification.stages.${stage}`);
    const endTimeLabel = this.i18n.t('notification.endTime', { time: endTime });

    return new NotificationInput({
      message: `🔔 ${stageLabel}\n⏲ ${endTimeLabel}`,
      title: task.title,
      url: task.url,
    });
  }
}
```

---

## 10. Guia de Implementacion

### 10.1 Crear un Nuevo Modulo

1. **Crear estructura de carpetas:**

```
src/[nuevo-modulo]/
├── application/
│   ├── dto/
│   ├── mappers/
│   ├── ports/
│   └── usecases/
├── domain/
│   └── [entidad]/
└── infrastructure/
    ├── adapters/
    │   ├── http/
    │   └── persistence/
    └── [modulo].module.ts
```

2. **Definir la entidad de dominio:**

```typescript
// domain/[entidad]/[entidad].entity.ts
export class MiEntidad {
  private constructor(payload?: Partial<MiEntidad>) {
    Object.assign(this, payload);
  }

  static create(payload: PropertiesOnly<MiEntidad>): MiEntidad {
    return new MiEntidad(payload);
  }

  // Metodos de logica de negocio
}
```

3. **Definir el repositorio abstracto:**

```typescript
// domain/[entidad]/[entidad].repository.ts
export abstract class MiEntidadRepository {
  abstract findAll(): Promise<MiEntidad[]>;
  abstract findById(id: Uuid): Promise<MiEntidad | null>;
  abstract save(entity: MiEntidad): Promise<void>;
}
```

4. **Crear los puertos necesarios:**

```typescript
// application/ports/[puerto].port.ts
export abstract class MiProveedorPort {
  abstract fetch(): Promise<MiEntidad[]>;
}
```

5. **Implementar los use cases:**

```typescript
// application/usecases/[accion]-[entidad].usecase.ts
@Injectable()
export class MiAccionUsecase {
  constructor(private readonly repository: MiEntidadRepository) {}

  async execute(): Promise<void> {
    // Logica del caso de uso
  }
}
```

6. **Implementar adaptadores de infraestructura:**

```typescript
// infrastructure/adapters/persistence/[db]/[entidad].repository.ts
@Injectable()
export class MongodbMiEntidadRepository implements MiEntidadRepository {
  // Implementacion
}
```

7. **Registrar en el modulo:**

```typescript
// [modulo].module.ts
@Module({
  providers: [
    MiAccionUsecase,
    {
      provide: MiEntidadRepository,
      useClass: MongodbMiEntidadRepository,
    },
  ],
})
export class MiModulo {}
```

### 10.2 Agregar un Nuevo Proveedor de Notificacion

1. **Implementar NotifierPort:**

```typescript
@Injectable()
export class NuevoNotifierService implements NotifierPort {
  readonly instance = NotifierTypes.NUEVO;

  async notify(payload: Notification): Promise<void> {
    // Implementacion
  }
}
```

2. **Registrar en NotificationModule:**

```typescript
providers: [
  NuevoNotifierService,
  {
    provide: NOTIFIERS,
    useFactory: NotifierFactory.createNotifiers(),
    inject: [DiscordNotifierService, PushoverNotifierService, NuevoNotifierService],
  },
];
```

### 10.3 Agregar un Nuevo Proveedor de Datos

1. **Implementar el Puerto:**

```typescript
@Injectable()
export class NuevoProviderService implements DailyTaskProviderPort {
  async fetchPendingTasks(): Promise<DailyTask[]> {
    // Implementacion con mapeo a entidad de dominio
  }
}
```

2. **Crear el Mapper:**

```typescript
export class NuevoProviderMapper {
  static toDomain(input: ExternalResponse): DailyTask {
    return DailyTask.create({
      /* mapeo */
    });
  }
}
```

3. **Cambiar binding en modulo:**

```typescript
{
  provide: DailyTaskProviderPort,
  useClass: NuevoProviderService,  // Cambiar implementacion
}
```

### 10.4 Checklist de Implementacion

- [ ] Crear estructura de carpetas del modulo
- [ ] Definir entidad de dominio con factory method
- [ ] Definir enums de dominio si aplica
- [ ] Definir repositorio abstracto
- [ ] Definir puertos de aplicacion
- [ ] Crear DTOs de entrada/salida
- [ ] Implementar mappers
- [ ] Crear use cases
- [ ] Implementar repositorio concreto
- [ ] Implementar adaptadores externos
- [ ] Crear controladores HTTP
- [ ] Crear schedulers si aplica
- [ ] Crear event listeners si aplica
- [ ] Registrar todo en el modulo
- [ ] Agregar traducciones i18n si aplica

---

## Apendice A: Tipos Utilitarios

```typescript
// Extrae solo propiedades (excluye metodos)
export type PropertiesOnly<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends Function ? never : K;
  }[keyof T]
>;

// Tipo para mapa de notificadores
export type Notifiers = Map<string, NotifierPort>;
```

---

## Apendice B: Variables de Entorno

```env
# Aplicacion
PORT=3000
TIME_ZONE=America/Bogota

# Autenticacion
API_USERNAME=admin
API_PASSWORD=secret

# MongoDB
MONGO_DB_URI=mongodb://localhost:27017
MONGO_DB_NAME=notifier

# Notion
NOTION_API_TOKEN=secret_xxx
NOTION_TASK_DATABASE_ID=xxx
NOTION_TASK_DATASOURCE=xxx

# Discord
DISCORD_BOT_TOKEN=xxx
DISCORD_CHANNEL_ID=xxx
DISCORD_THUMBNAIL_URL=https://...

# Pushover
PUSHOVER_URL=https://api.pushover.net
PUSHOVER_API_KEY=xxx
PUSHOVER_API_USER=xxx

# Notificaciones
NOTIFICATION_PROVIDER=DISCORD
NOTIFICATION_TTL=3600

# i18n
I18N_DEFAULT_LANG=es
I18N_FALLBACK_LANG=es
```

---

**Documento generado para el proyecto Notifier**
**Version**: 1.0
**Fecha**: Febrero 2026
