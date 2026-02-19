import { Injectable, Logger } from '@nestjs/common';
import { Uuid } from '@shared/domain/value-objects';
import { OkrTaskRepository } from '@okr/domain';

@Injectable()
export class RemoveOkrTaskUsecase {
  private readonly logger = new Logger(RemoveOkrTaskUsecase.name);

  constructor(private readonly okrTaskRepository: OkrTaskRepository) {}

  async execute(taskId: Uuid): Promise<void> {
    await this.okrTaskRepository.remove(taskId);

    this.logger.log('Removed OKR task from cache', {
      taskId: taskId.value,
    });
  }
}
