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
  DailyTaskProviderPort,
} from './application/ports';
import { DailyTaskRepository } from './domain';
import {
  MongodbTaskEntityProvider,
  MongodbDailyTaskRepository,
} from './infrastructure/adapters/persistence/mongodb/task';
import { DailyTaskEvent } from './infrastructure/adapters/events';
import { SetupDailyTaskService } from './infrastructure/adapters/bootstrap';
import { DailyTaskNotifier } from './infrastructure/adapters/notifier';

@Module({
  imports: [
    NotificationModule,
    MongooseModule.forFeature([MongodbTaskEntityProvider]),
  ],
  controllers: [DailyTaskController],
  providers: [
    DailyTaskScheduler,
    SetupDailyTaskService,
    DailyTaskEvent,
    NotifyDailyTaskUsecase,
    PurgeDailyTaskUsecase,
    RemoveDailyTaskUsecase,
    RetrieveDailyTaskUsecase,
    SetupDailyTaskUsecase,
    SyncDailyTaskUsecase,
    VisibilityDailyTaskUsecase,
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
