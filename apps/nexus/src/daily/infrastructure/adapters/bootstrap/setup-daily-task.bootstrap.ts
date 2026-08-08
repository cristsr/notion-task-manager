import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ErrorLogFormatter } from '@shared/application/logging';
import { NotifyDailyTaskUsecase, PurgeDailyTaskUsecase, SetupDailyTaskUsecase } from '@daily/application/usecases';

@Injectable()
export class SetupDailyTaskBootstrap implements OnModuleInit {
  private readonly logger = new Logger(SetupDailyTaskBootstrap.name);

  constructor(
    private readonly syncTaskUsecase: SetupDailyTaskUsecase,
    private readonly purgeTaskUsecase: PurgeDailyTaskUsecase,
    private readonly notifyTaskUsecase: NotifyDailyTaskUsecase,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.syncTaskUsecase.execute();
      await this.purgeTaskUsecase.execute();
      await this.notifyTaskUsecase.execute();
    } catch (error) {
      this.logger.error(ErrorLogFormatter.format(error));
    }
  }
}
