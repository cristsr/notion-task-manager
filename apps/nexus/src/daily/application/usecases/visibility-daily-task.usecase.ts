import { Injectable } from '@nestjs/common';
import { DailyTaskRepository } from '@daily/domain';
import { DailyTaskDataSourcePort } from '../ports';

@Injectable()
export class VisibilityDailyTaskUsecase {
  constructor(
    private readonly taskRepository: DailyTaskRepository,
    private readonly notionRepository: DailyTaskDataSourcePort,
  ) {}

  /**
   * Reveal daily tasks that entered their visibility window
   */
  async execute(): Promise<void> {
    const tasks = await this.taskRepository.getAllTask();

    for (const task of tasks) {
      if (!task.mustBeVisible()) continue;
      task.setVisible(true);
      await this.taskRepository.save(task);
      await this.notionRepository.updateVisibility(task);
    }
  }
}
