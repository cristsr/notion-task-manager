import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SyncOkrTaskObjectiveUsecase,
  PropagateObjectiveToTasksUsecase,
  RemoveOkrTaskUsecase,
  RemoveKeyResultUsecase,
  SetupOkrUsecase,
} from './application/usecases';
import {
  OkrTaskProviderPort,
  KeyResultProviderPort,
  ObjectiveProviderPort,
} from './application/ports';
import { OkrTaskRepository, KeyResultRepository } from './domain';
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

@Module({
  imports: [
    MongooseModule.forFeature([
      MongodbOkrTaskEntityProvider,
      MongodbKeyResultEntityProvider,
    ]),
  ],
  providers: [
    SetupOkrService,
    OkrTaskEvent,
    SyncOkrTaskObjectiveUsecase,
    PropagateObjectiveToTasksUsecase,
    RemoveOkrTaskUsecase,
    RemoveKeyResultUsecase,
    SetupOkrUsecase,
    {
      provide: OkrTaskProviderPort,
      useClass: NotionOkrTaskProvider,
    },
    {
      provide: KeyResultProviderPort,
      useClass: NotionKeyResultProvider,
    },
    {
      provide: ObjectiveProviderPort,
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
  ],
})
export class OkrModule {}
