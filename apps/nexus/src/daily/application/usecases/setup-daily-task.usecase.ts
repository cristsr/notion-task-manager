import { Injectable } from '@nestjs/common';
import { DailyTaskRepository } from '@daily/domain';
import { DailyTaskDataSourcePort } from '../ports';

@Injectable()
export class SetupDailyTaskUsecase {
  constructor(
    private readonly taskProvider: DailyTaskDataSourcePort,
    private readonly taskRepository: DailyTaskRepository,
  ) {}

  /**
   * Set up daily tasks at the start of the application
   */
  async execute(): Promise<void> {
    const tasks = await this.taskProvider.fetchPendingTasks();

    for (const task of tasks) {
      const existingTask = await this.taskRepository.findById(task.id);

      if (!existingTask) {
        await this.taskRepository.insert(task);
        continue;
      }

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
}
