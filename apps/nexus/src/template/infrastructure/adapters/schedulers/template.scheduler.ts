import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ErrorLogFormatter } from '@shared/application/logging';
import { CreateTemplatedTasksUsecase } from '@template/application/usecases';

@Injectable()
export class TemplateScheduler {
  private readonly logger = new Logger(TemplateScheduler.name);

  constructor(
    private readonly createTemplatedTasksUsecase: CreateTemplatedTasksUsecase,
    private readonly config: ConfigService,
  ) {}

  /**
   * Hourly, so a day is not lost when the service was down at the creation hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async createTemplatedTasks(): Promise<void> {
    // Deployments that do not use Kaneo leave its settings empty
    if (!this.config.get('KANEO_TEMPLATE_PROJECT_ID')) return;

    try {
      await this.createTemplatedTasksUsecase.execute();
    } catch (error) {
      this.logger.error(ErrorLogFormatter.format(error));
    }
  }
}
