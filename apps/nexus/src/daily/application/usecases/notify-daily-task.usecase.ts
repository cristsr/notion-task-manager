import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { DailyTaskRepository } from '@daily/domain';
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

      await this.taskNotifier.notify(task);

      task.notify();

      await this.taskRepository.save(task);
    }
  }
}
