import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { DailyTaskRepository } from '@daily/domain';
import { ErrorLogFormatter } from '@shared/application/logging';
import { DailyTaskNotifierPort } from '../ports';

@Injectable()
export class NotifyDailyTaskUsecase {
  private readonly logger = new Logger(NotifyDailyTaskUsecase.name);

  constructor(
    private readonly taskRepository: DailyTaskRepository,
    private readonly taskNotifier: DailyTaskNotifierPort,
  ) {}

  /**
   * Notify daily tasks
   */
  async execute(): Promise<void> {
    const now = DateTime.local();

    this.logger.log(`Checking tasks for notification at ${now.toISO()}`);

    const tasks = await this.taskRepository.getAllTask();

    for (const task of tasks) {
      if (!task.shouldNotify()) {
        continue;
      }

      try {
        await this.taskNotifier.notify(task);
      } catch (error) {
        // A failed delivery must not mark the task as notified, and must not
        // abort the remaining tasks of this run — it is retried next cycle.
        this.logger.error(ErrorLogFormatter.format(error));
        continue;
      }

      task.notify();

      await this.taskRepository.save(task);
    }
  }
}
