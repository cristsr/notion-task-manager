import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationModule } from '../notification/notification.module';
import { TaskController } from './infrastructure/adapters/http';
import { TaskScheduler } from './infrastructure/adapters/schedulers';
import { NotionTaskProvider } from './infrastructure/adapters/notion';
import {
  NotifyTaskUsecase,
  PurgeTaskUsecase,
  RemoveTaskUsecase,
  RetrieveTaskUsecase,
  SetupTaskUsecase,
  SyncTaskUsecase,
  VisibilityTaskUsecase,
} from './application/usecases';
import { TaskNotifierPort, TaskProviderPort } from './application/ports';
import { TaskRepository } from './domain';
import {
  MongodbTaskEntityProvider,
  MongodbTaskRepository,
} from './infrastructure/adapters/persistence/mongodb/task';
import { EventTaskService } from './infrastructure/adapters/events';
import { SetupTaskService } from './infrastructure/adapters/bootstrap';
import { TaskNotifier } from './infrastructure/adapters/notifier/task-notifier';

@Module({
  imports: [
    NotificationModule,
    MongooseModule.forFeature([MongodbTaskEntityProvider]),
  ],
  controllers: [TaskController],
  providers: [
    TaskScheduler,
    SetupTaskService,
    EventTaskService,
    NotifyTaskUsecase,
    PurgeTaskUsecase,
    RemoveTaskUsecase,
    RetrieveTaskUsecase,
    SetupTaskUsecase,
    SyncTaskUsecase,
    VisibilityTaskUsecase,
    {
      provide: TaskProviderPort,
      useClass: NotionTaskProvider,
    },
    {
      provide: TaskRepository,
      useClass: MongodbTaskRepository,
    },
    {
      provide: TaskNotifierPort,
      useClass: TaskNotifier,
    },
  ],
})
export class TaskModule {}
