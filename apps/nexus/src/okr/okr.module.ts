import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SyncOkrTaskObjectiveUsecase,
  SyncOkrKeyResultUsecase,
  RemoveOkrTaskUsecase,
  SetupOkrUsecase,
  SyncOkrTaskStatusUsecase,
} from './application/usecases';
import {
  OkrTaskRepository,
  OkrTaskDataSourcePort,
  OkrTaskService,
  KeyResultRepository,
  KeyResultDataSourcePort,
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
import { OkrTaskEventHandler, OkrKeyResultEventHandler } from './infrastructure/adapters/events';
import { SetupOkrBootstrap } from './infrastructure/adapters/bootstrap';

@Module({
  imports: [MongooseModule.forFeature([MongodbOkrTaskEntityProvider, MongodbKeyResultEntityProvider])],
  providers: [
    SetupOkrBootstrap,
    OkrTaskEventHandler,
    OkrKeyResultEventHandler,
    SyncOkrTaskObjectiveUsecase,
    SyncOkrKeyResultUsecase,
    RemoveOkrTaskUsecase,
    SetupOkrUsecase,
    SyncOkrTaskStatusUsecase,
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
  ],
})
export class OkrModule {}
