import { Injectable, Logger } from '@nestjs/common';
import { Uuid } from '@shared/domain/value-objects';
import {
  OkrTaskRepository,
  KeyResultRepository,
  OkrTask,
  KeyResult,
} from '@okr/domain';
import {
  OkrTaskProviderPort,
  KeyResultProviderPort,
  ObjectiveProviderPort,
} from '@okr/application/ports';
import { Nullable } from '@shared/domain/types';

@Injectable()
export class SyncOkrTaskObjectiveUsecase {
  private readonly logger = new Logger(SyncOkrTaskObjectiveUsecase.name);

  constructor(
    private readonly okrTaskRepository: OkrTaskRepository,
    private readonly keyResultRepository: KeyResultRepository,
    private readonly okrTaskProvider: OkrTaskProviderPort,
    private readonly keyResultProvider: KeyResultProviderPort,
    private readonly objectiveProvider: ObjectiveProviderPort,
  ) {}

  async execute(taskId: Uuid): Promise<void> {
    const currentTask = await this.okrTaskRepository.findById(taskId);
    const nextTask = await this.okrTaskProvider.fetchById(taskId);

    if (!nextTask) {
      this.logger.warn('Task not found in Notion', { taskId: taskId.value });
      return;
    }

    const shouldSync = currentTask?.hasKeyResultChanged(nextTask.keyResultId);

    if (!shouldSync) {
      this.logger.debug('KeyResult has not changed, skipping sync', {
        taskId: taskId.value,
      });
      await this.saveTask(nextTask);
      return;
    }

    await this.syncObjective(nextTask);
    await this.saveTask(nextTask);
  }

  private async syncObjective(task: OkrTask): Promise<void> {
    if (task.shouldClearObjective()) {
      // Proceed to remove objective from task

      await this.okrTaskProvider.updateObjective(task.id, null);

      task.updateObjective(null);

      this.logger.log('Cleared objective from task (no KeyResult)', {
        taskId: task.id.value,
      });

      await this.saveTask(task);
      return;
    }

    // The keyResult is present and we can proceed to sync objective

    const keyResult = await this.retrieveKeyResult(task.keyResultId);

    if (!keyResult) {
      this.logger.warn('KeyResult not found', {
        taskId: task.id.value,
        keyResultId: task.keyResultId?.value ?? null,
      });
      return;
    }

    // The key result has not an objective, we can proceed to remove it from the task
    if (!keyResult.objectiveId && task.objectiveId) {
      await this.okrTaskProvider.updateObjective(task.id, null);

      task.updateObjective(null);

      this.logger.log(
        'Cleared objective from task (KeyResult has no Objective)',
        {
          taskId: task.id.value,
        },
      );

      await this.saveTask(task);
      return;
    }

    // Otherwise, the key result has an objective, we can proceed to sync it

    const objective = await this.objectiveProvider.fetchById(
      keyResult.objectiveId,
    );

    if (!objective) {
      this.logger.warn('Objective not found', {
        objectiveId: keyResult.objectiveId.value,
      });
      return;
    }

    await this.okrTaskProvider.updateObjective(task.id, objective.id);
    task.updateObjective(objective.id);

    this.logger.log('Synced task objective', {
      taskId: task.id.value,
      objectiveId: objective.id.value,
    });
  }

  private async saveTask(task: OkrTask): Promise<void> {
    task.markAsUpdated();
    await this.okrTaskRepository.save(task);
  }

  private async retrieveKeyResult(
    keyResultId: Uuid,
  ): Promise<Nullable<KeyResult>> {
    return (
      (await this.keyResultRepository.findById(keyResultId)) ||
      (await this.keyResultProvider.fetchById(keyResultId))
    );
  }
}
