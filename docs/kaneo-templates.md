# Plantillas de tareas en Kaneo

Kaneo repite una tarea cuando se completa: la siguiente nace al pasar la actual a una columna final.
Las plantillas de Notion funcionaban distinto, creaban la tarea en una fecha fija aunque la anterior siguiera abierta.
El modulo `template` devuelve ese comportamiento.

## Como funciona

1. Las plantillas viven en Kaneo, en un proyecto aparte (`KANEO_TEMPLATE_PROJECT_ID`). Son tareas normales que nunca se completan.
2. La regla de repeticion se lee de la propia plantilla:
   - el campo **repetir** dice la frecuencia (diaria, semanal, mensual o anual), el intervalo y, en las semanales, los dias;
   - la **fecha de vencimiento** es el primer dia del calendario, de ahi se cuentan los pasos.
3. `TemplateScheduler` corre cada hora. `CreateTemplatedTasksUsecase` evalua `TaskTemplate.isDueOn` para el dia de hoy
   y, si toca, crea en el proyecto Daily (`KANEO_DAILY_PROJECT_ID`) una tarea con el mismo titulo, descripcion y prioridad,
   con vencimiento hoy.
4. No crea nada antes de las 8:00 hora local, y no duplica: si ya hay una tarea con ese titulo y vencimiento (abierta o archivada) la omite.
   Por eso correr cada hora no molesta, y un dia en que el servicio estuvo caido a las 8:00 se recupera al volver.

Los meses mas cortos usan su ultimo dia: una plantilla del 31 corre el 28 de febrero.

## Poner una plantilla

En el proyecto de plantillas, crear una tarea con el titulo, la descripcion (la checklist `- [ ]`) y la prioridad que deben tener
las tareas, ponerle vencimiento el primer dia y activar **Repetir**. Una tarea sin vencimiento o sin repeticion se omite con un aviso en el log.

La descripcion se copia tal cual, por eso los links y numeros de contrato viven en Kaneo y no en el repositorio.

## Configuracion

| Variable                    | Para que sirve                                             |
| --------------------------- | ---------------------------------------------------------- |
| `KANEO_URL`                 | URL base de Kaneo, sin `/api`                              |
| `KANEO_API_KEY`             | Clave de API con permiso para leer y crear tareas          |
| `KANEO_DAILY_PROJECT_ID`    | Proyecto donde se crean las tareas                         |
| `KANEO_TEMPLATE_PROJECT_ID` | Proyecto donde estan las plantillas                        |
| `KANEO_TASK_STATUS`         | Columna donde nacen las tareas, por defecto `to-do`        |

Si `KANEO_TEMPLATE_PROJECT_ID` esta vacio el scheduler no hace nada, asi un despliegue que no usa Kaneo no registra errores.

## Limites conocidos

- Solo evalua el dia de hoy: si el servicio estuvo caido todo un dia, esa tarea no se crea despues.
- Las tareas creadas no heredan etiquetas, asignado ni subtareas de la plantilla, solo titulo, descripcion y prioridad.
- Las tareas de Daily no deben tener repeticion propia: si la tienen, al completarlas Kaneo crea otra y habria duplicados.
