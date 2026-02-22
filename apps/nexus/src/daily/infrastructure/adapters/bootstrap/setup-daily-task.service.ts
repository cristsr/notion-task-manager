import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  NotifyDailyTaskUsecase,
  PurgeDailyTaskUsecase,
  SetupDailyTaskUsecase,
} from '@daily/application/usecases';

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
