import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SyncOkrTaskObjectiveUsecase,
  PropagateObjectiveToTasksUsecase,
  RemoveOkrTaskUsecase,
  SetupOkrUsecase,
} from './application/usecases';
import {
  OkrTaskRepository,
  OkrTaskDataSourcePort,
  OkrTaskService,
  KeyResultRepository,
  KeyResultDataSourcePort,
  KeyResultService,
  ObjectiveSourcePort,
} from './domain';
import {
  MongodbOkrTaskEntityProvider,
  MongodbOkrTaskRepository,
  MongodbKeyResultEntityProvider,
  MongodbKeyResultRepository,
} from './infrastructure/adapters/persistence/mongodb';
import {
  NotionOkrTaskProvider,
  NotionKeyResultProvider,
  NotionObjectiveProvider,
} from './infrastructure/adapters/notion';
import { OkrTaskEvent } from './infrastructure/adapters/events';
import { SetupOkrService } from './infrastructure/adapters/bootstrap';
import { OkrTaskUpdate } from '@okr/infrastructure/scripts';

@Module({
  imports: [MongooseModule.forFeature([MongodbOkrTaskEntityProvider, MongodbKeyResultEntityProvider])],
  providers: [
    SetupOkrService,
    OkrTaskEvent,
    SyncOkrTaskObjectiveUsecase,
    PropagateObjectiveToTasksUsecase,
    RemoveOkrTaskUsecase,
    SetupOkrUsecase,
    OkrTaskUpdate,
    {
      provide: OkrTaskDataSourcePort,
      useClass: NotionOkrTaskProvider,
    },
    {
      provide: KeyResultDataSourcePort,
      useClass: NotionKeyResultProvider,
    },
    {
      provide: ObjectiveSourcePort,
      useClass: NotionObjectiveProvider,
    },
    {
      provide: OkrTaskRepository,
      useClass: MongodbOkrTaskRepository,
    },
    {
      provide: KeyResultRepository,
      useClass: MongodbKeyResultRepository,
    },
    {
      provide: OkrTaskService,
      useFactory: (
        taskRepository: OkrTaskRepository,
        okrTaskDatasource: OkrTaskDataSourcePort,
        keyResultSource: KeyResultDataSourcePort,
      ) => new OkrTaskService(taskRepository, okrTaskDatasource, keyResultSource),
      inject: [OkrTaskRepository, OkrTaskDataSourcePort, KeyResultDataSourcePort],
    },
    {
      provide: KeyResultService,
      useFactory: (
        keyResultSource: KeyResultDataSourcePort,
        okrTaskService: OkrTaskService,
        okrTaskDataSource: OkrTaskDataSourcePort,
      ) => new KeyResultService(keyResultSource, okrTaskService, okrTaskDataSource),
      inject: [KeyResultDataSourcePort, OkrTaskService, OkrTaskDataSourcePort],
    },
  ],
})
export class OkrModule {}
