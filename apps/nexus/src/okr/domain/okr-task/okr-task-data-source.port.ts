import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { OkrTask } from './okr-task.entity';

export abstract class OkrTaskDataSourcePort {
  abstract fetchById(id: Uuid): Promise<Nullable<OkrTask>>;
  abstract updateObjective(taskId: Uuid, objectiveId: Nullable<Uuid>): Promise<void>;
  abstract updateKeyResult(taskId: Uuid, keyResultId: Nullable<Uuid>): Promise<void>;
  abstract updateProgress(taskId: Uuid, progress: number): Promise<void>;
  abstract getTasksByKeyResultId(keyResultId: Uuid): Promise<OkrTask[]>;
  abstract getPendingTasks(): Promise<OkrTask[]>;
}
