import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationModule } from '@notification/notification.module';
import { DailyTaskController } from './infrastructure/adapters/http';
import { DailyTaskScheduler } from './infrastructure/adapters/schedulers';
import { NotionDailyTaskProvider } from './infrastructure/adapters/notion';
import {
  NotifyDailyTaskUsecase,
  PurgeDailyTaskUsecase,
  RemoveDailyTaskUsecase,
  RetrieveDailyTaskUsecase,
  SetupDailyTaskUsecase,
  SyncDailyTaskUsecase,
  VisibilityDailyTaskUsecase,
} from './application/usecases';
import {
  DailyTaskNotifierPort,
  DailyTaskDataSourcePort,
} from './application/ports';
import { DailyTaskRepository } from './domain';
import {
  MongodbTaskEntityProvider,
  MongodbDailyTaskRepository,
} from './infrastructure/adapters/persistence/mongodb/task';
import { DailyTaskEventHandler } from './infrastructure/adapters/events';
import { SetupDailyTaskBootstrap } from './infrastructure/adapters/bootstrap';
import { DailyTaskNotifier } from './infrastructure/adapters/notifier';

@Module({
  imports: [
    NotificationModule,
    MongooseModule.forFeature([MongodbTaskEntityProvider]),
  ],
  controllers: [DailyTaskController],
  providers: [
    DailyTaskScheduler,
    SetupDailyTaskBootstrap,
    DailyTaskEventHandler,
    NotifyDailyTaskUsecase,
    PurgeDailyTaskUsecase,
    RemoveDailyTaskUsecase,
    RetrieveDailyTaskUsecase,
    SetupDailyTaskUsecase,
    SyncDailyTaskUsecase,
    VisibilityDailyTaskUsecase,
    {
      provide: DailyTaskDataSourcePort,
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
