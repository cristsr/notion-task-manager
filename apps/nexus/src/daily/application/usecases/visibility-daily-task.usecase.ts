import { Injectable } from '@nestjs/common';
import { DailyTaskRepository } from '@daily/domain';
import { DailyTaskProviderPort } from '../ports';

@Injectable()
export class VisibilityDailyTaskUsecase {
  private readonly HOURS_TO_HIDE = 48;

  constructor(
    private readonly taskRepository: DailyTaskRepository,
    private readonly notionRepository: DailyTaskProviderPort,
  ) {}

  /**
   * Set daily tasks to visible if they are younger than HOURS_TO_HIDE
   */
  async execute(): Promise<void> {
    const tasks = await this.taskRepository.getAllTask();

    for (const task of tasks) {
      if (!task.mustBeVisible(this.HOURS_TO_HIDE)) continue;
      task.setVisible(true);
      await this.taskRepository.save(task);
      await this.notionRepository.update(task);
    }
  }
}
