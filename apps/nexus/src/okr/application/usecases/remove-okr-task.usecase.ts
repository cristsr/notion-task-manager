import { Injectable } from '@nestjs/common';
import { Uuid } from '@shared/domain/value-objects';
import { OkrTaskRepository } from '@okr/domain';

@Injectable()
export class RemoveOkrTaskUsecase {
  constructor(private readonly okrTaskRepository: OkrTaskRepository) {}

  async execute(taskId: Uuid): Promise<void> {
    await this.okrTaskRepository.remove(taskId);
  }
}
