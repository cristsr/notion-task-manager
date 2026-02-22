import { Injectable, Logger } from '@nestjs/common';
import { Uuid } from '@shared/domain/value-objects';
import { OkrTaskService } from '@okr/domain';

@Injectable()
export class SyncOkrTaskObjectiveUsecase {
  private readonly logger = new Logger(SyncOkrTaskObjectiveUsecase.name);

  constructor(private readonly okrTaskService: OkrTaskService) {}

  async execute(taskId: Uuid): Promise<void> {
    try {
      await this.okrTaskService.syncObjective(taskId);
    } catch (error) {
      this.logger.error(error.message, {
        taskId: taskId.value,
        code: error.code,
      });
      throw error;
    }
  }
}
