import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { TaskRepository } from '../../domain';
import { TaskNotifierPort } from '../ports';

@Injectable()
export class NotifyTaskUsecase {
  private readonly logger = new Logger(NotifyTaskUsecase.name);

  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly taskNotifier: TaskNotifierPort,
  ) {}

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
