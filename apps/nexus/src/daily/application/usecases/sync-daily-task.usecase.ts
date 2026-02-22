import { Injectable } from '@nestjs/common';
import { DailyTaskProviderPort } from '../ports';
import { Uuid } from '@shared/domain/value-objects';
import { DailyTaskRepository } from '@daily/domain';

@Injectable()
export class SyncDailyTaskUsecase {
  constructor(
    private readonly taskRepository: DailyTaskRepository,
    private readonly taskProvider: DailyTaskProviderPort,
  ) {}

  /**
   * Sync daily task with task provider
   * @param taskId
   */
  async execute(taskId: Uuid): Promise<void> {
    const task = await this.taskProvider.fetchById(taskId);

    if (task.isDone()) {
      await this.taskRepository.remove(task);
      return;
    }

    const existingTask = await this.taskRepository.findById(taskId);

    if (!existingTask) {
      await this.taskRepository.insert(task);
      return;
    }

    // Only update props from task provider
    existingTask.update({
      title: task.title,
      date: task.date,
      status: task.status,
      priority: task.priority,
      type: task.type,
      assignedTo: task.assignedTo,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
      hidden: task.hidden,
      url: task.url,
    });

    await this.taskRepository.update(existingTask);
  }
}
