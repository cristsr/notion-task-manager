import { Injectable } from '@nestjs/common';
import { Uuid } from '../../../shared/domain/value-objects';
import { TaskRepository } from '../../domain';

@Injectable()
export class RemoveTaskUsecase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(taskId: Uuid): Promise<void> {
    const task = await this.taskRepository.findById(taskId);
    await this.taskRepository.remove(task);
  }
}
