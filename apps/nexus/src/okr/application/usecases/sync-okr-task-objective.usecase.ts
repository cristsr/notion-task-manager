import { Injectable } from '@nestjs/common';
import { Uuid } from '@shared/domain/value-objects';
import { OkrTaskService } from '@okr/domain';

@Injectable()
export class SyncOkrTaskObjectiveUsecase {
  constructor(private readonly okrTaskService: OkrTaskService) {}

  async execute(taskId: Uuid): Promise<void> {
    await this.okrTaskService.syncObjective(taskId);
  }
}
