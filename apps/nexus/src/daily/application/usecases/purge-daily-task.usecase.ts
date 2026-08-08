import { Injectable } from '@nestjs/common';
import { DailyTaskRepository } from '@daily/domain';
import { DailyTaskDataSourcePort } from '../ports';

@Injectable()
export class PurgeDailyTaskUsecase {
  constructor(
    private readonly taskRepository: DailyTaskRepository,
    private readonly notionTaskRepository: DailyTaskDataSourcePort,
  ) {}

  /**
   * Purge daily tasks that were completed in Notion
   */
  async execute(): Promise<void> {
    const tasks = await this.notionTaskRepository.fetchPendingTasks();

    const existingTasks = await this.taskRepository.getAllTask();

    const tasksToRemove = existingTasks.filter((exist) => !tasks.some((task) => task.id.equals(exist.id)));

    for (const task of tasksToRemove) {
      await this.taskRepository.remove(task);
    }
  }
}
