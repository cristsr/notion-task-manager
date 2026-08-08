import { Injectable } from '@nestjs/common';
import { Uuid } from '@shared/domain/value-objects';
import { DailyTaskRepository } from '@daily/domain';

@Injectable()
export class RemoveDailyTaskUsecase {
  constructor(private readonly taskRepository: DailyTaskRepository) {}

  /**
   * Remove daily task by id
   * @param taskId
   */
  async execute(taskId: Uuid): Promise<void> {
    const task = await this.taskRepository.findById(taskId);

    if (!task) return;

    await this.taskRepository.remove(task);
  }
}
