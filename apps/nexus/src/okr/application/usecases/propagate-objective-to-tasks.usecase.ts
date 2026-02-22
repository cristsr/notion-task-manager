import { Injectable, Logger } from '@nestjs/common';
import { Uuid } from '@shared/domain/value-objects';
import { KeyResultService } from '@okr/domain';

@Injectable()
export class PropagateObjectiveToTasksUsecase {
  private readonly logger = new Logger(PropagateObjectiveToTasksUsecase.name);

  constructor(private readonly keyResultService: KeyResultService) {}

  async execute(keyResultId: Uuid): Promise<void> {
    try {
      await this.keyResultService.syncKeyResult(keyResultId);
    } catch (error) {
      this.logger.warn(error.message, {
        keyResultId: keyResultId.value,
        code: error.code,
      });
      throw error;
    }
  }
}
