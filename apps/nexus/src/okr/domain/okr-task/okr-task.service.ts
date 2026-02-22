import { match, P } from 'ts-pattern';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { OkrTask } from './okr-task.entity';
import { OkrTaskRepository } from './okr-task.repository';
import { OkrTaskDataSourcePort } from './okr-task-data-source.port';
import { OkrTaskNotFoundError, TaskCleanupFailedError } from './okr-task.errors';
import { KeyResult, KeyResultDataSourcePort } from '../key-result';

export class OkrTaskService {
  constructor(
    private readonly okrTaskRepository: OkrTaskRepository,
    private readonly okrTaskDataSource: OkrTaskDataSourcePort,
    private readonly keyResultSource: KeyResultDataSourcePort,
  ) {}

  async syncObjective(taskId: Uuid): Promise<void> {
    const task = await this.okrTaskDataSource.fetchById(taskId);

    if (!task) {
      // The only case where this should happen is when the task is deleted
      // from Notion and the crete event is not handled yet.
      throw new OkrTaskNotFoundError(taskId.value);
    }

    if (!task.keyResultId) {
      // Task has no key result yet
      await this.okrTaskRepository.save(task);
      return;
    }

    const keyResult = await this.keyResultSource.fetchById(task.keyResultId);

    await this.execObjectiveSync(task, keyResult);
  }

  async updateTaskObjective(task: OkrTask, objectiveId: Nullable<Uuid>): Promise<void> {
    await this.okrTaskDataSource.updateObjective(task.id, objectiveId);
    task.setObjective(objectiveId);
    await this.okrTaskRepository.save(task);
  }

  async unlinkKeyResultFromTasks(keyResultId: Uuid): Promise<void> {
    const tasks = await this.okrTaskRepository.findByKeyResultId(keyResultId);
    const failedTaskIds: string[] = [];
    let cleanedCount = 0;

    for (const task of tasks) {
      try {
        await this.okrTaskDataSource.updateObjective(task.id, null);
        task.unlinkFromKeyResult();
        await this.okrTaskRepository.save(task);
        cleanedCount++;
      } catch {
        failedTaskIds.push(task.id.value);
      }
    }

    if (failedTaskIds.length > 0) {
      throw new TaskCleanupFailedError(failedTaskIds, tasks.length - cleanedCount);
    }
  }

  async execObjectiveSync(task: OkrTask, keyResult: KeyResult): Promise<void> {
    await match([task.objectiveId, keyResult?.objectiveId])
      .with([P.nullish, P.nullish], () => {
        task.markAsUpdated();
        this.okrTaskRepository.save(task);
      })

      // Task hasn't an objective, but the key result has an objective -> update task with key result objective
      .with([P.nullish, P.nonNullable], async () => {
        await this.okrTaskDataSource.updateObjective(task.id, keyResult.objectiveId);
        task.markAsUpdated();
        await this.okrTaskRepository.save(task);
      })

      // Task has an objective, but the key result doesn't have an objective -> null task key result and save
      .with([P.nonNullable, P.nullish], async () => {
        task.keyResultId = null;
        await this.okrTaskDataSource.updateKeyResult(task.id, task.keyResultId);
        task.markAsUpdated();
        await this.okrTaskRepository.save(task);
      })

      // task has objective and key result has objective -> are different -> update task objective
      .with([P.nonNullable, P.nonNullable], async ([taskObjectiveId, krObjectiveId]) => {
        if (!taskObjectiveId.equals(krObjectiveId)) {
          // assing new valid objective to task
          await this.okrTaskDataSource.updateObjective(task.id, krObjectiveId);
        }

        task.markAsUpdated();
        await this.okrTaskRepository.save(task);
      })
      .exhaustive();
  }
}
