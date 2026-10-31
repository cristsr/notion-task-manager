import { Module } from '@nestjs/common';
import { RoutineTaskPort, TaskTemplateSourcePort } from './application/ports';
import { CreateTemplatedTasksUsecase } from './application/usecases';
import { KaneoClient, KaneoRoutineTaskProvider, KaneoTaskTemplateProvider } from './infrastructure/adapters/kaneo';
import { TemplateScheduler } from './infrastructure/adapters/schedulers';

@Module({
  providers: [
    TemplateScheduler,
    CreateTemplatedTasksUsecase,
    KaneoClient,
    {
      provide: TaskTemplateSourcePort,
      useClass: KaneoTaskTemplateProvider,
    },
    {
      provide: RoutineTaskPort,
      useClass: KaneoRoutineTaskProvider,
    },
  ],
})
export class TemplateModule {}
