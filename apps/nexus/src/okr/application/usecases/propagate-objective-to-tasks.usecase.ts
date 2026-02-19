import { Injectable, Logger } from '@nestjs/common';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { KeyResultRepository, OkrTaskRepository, KeyResult } from '@okr/domain';
import {
  KeyResultProviderPort,
  OkrTaskProviderPort,
} from '@okr/application/ports';

@Injectable()
export class PropagateObjectiveToTasksUsecase {
  private readonly logger = new Logger(PropagateObjectiveToTasksUsecase.name);

  constructor(
    private readonly keyResultRepository: KeyResultRepository,
    private readonly okrTaskRepository: OkrTaskRepository,
    private readonly keyResultProvider: KeyResultProviderPort,
    private readonly okrTaskProvider: OkrTaskProviderPort,
  ) {}

  async execute(keyResultId: Uuid): Promise<void> {
    const currKeyResult = await this.keyResultRepository.findById(keyResultId);

    const nextKeyResult = await this.keyResultProvider.fetchById(keyResultId);

    if (!nextKeyResult) {
      this.logger.warn('KeyResult not found in Notion', {
        keyResultId: keyResultId.value,
      });

      return;
    }

    const shouldPropagate = currKeyResult?.hasObjectiveChanged(
      nextKeyResult.objectiveId,
    );

    if (!shouldPropagate) {
      this.logger.debug('Objective has not changed, skipping propagation', {
        keyResultId: keyResultId.value,
      });

      await this.saveKeyResult(nextKeyResult);

      return;
    }

    await this.propagateToTasks(nextKeyResult);
    await this.saveKeyResult(nextKeyResult);
  }

  private async propagateToTasks(keyResult: KeyResult): Promise<void> {
    if (!keyResult.taskIds.length) {
      this.logger.debug('No tasks associated with KeyResult', {
        keyResultId: keyResult.id.value,
      });

      return;
    }

    this.logger.log('Propagating objective to tasks', {
      keyResultId: keyResult.id.value,
      objectiveId: keyResult.objectiveId?.value ?? null,
      taskCount: keyResult.taskIds.length,
    });

    for (const taskId of keyResult.taskIds) {
      await this.updateTaskObjective(taskId, keyResult.objectiveId);
    }
  }

  private async updateTaskObjective(
    taskId: Uuid,
    objectiveId: Nullable<Uuid>,
  ): Promise<void> {
    try {
      await this.okrTaskProvider.updateObjective(taskId, objectiveId);

      const task = await this.okrTaskRepository.findById(taskId);

      if (!task) {
        return;
      }

      task.updateObjective(objectiveId);
      await this.okrTaskRepository.save(task);

      this.logger.debug('Updated task objective', {
        taskId: taskId.value,
        objectiveId: objectiveId?.value ?? null,
      });
    } catch (error) {
      this.logger.error('Failed to update task objective', {
        taskId: taskId.value,
        message: error.message,
      });
    }
  }

  private async saveKeyResult(keyResult: KeyResult): Promise<void> {
    keyResult.markAsUpdated();
    await this.keyResultRepository.save(keyResult);
  }
}
