import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  NotifyDailyTaskUsecase,
  VisibilityDailyTaskUsecase,
} from '@daily/application/usecases';

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
