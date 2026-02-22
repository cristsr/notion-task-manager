import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { OkrTask } from './okr-task.entity';

export abstract class OkrTaskRepository {
  abstract findById(id: Uuid): Promise<Nullable<OkrTask>>;
  abstract findByKeyResultId(keyResultId: Uuid): Promise<OkrTask[]>;
  abstract create(task: OkrTask): Promise<void>;
  abstract save(task: OkrTask): Promise<void>;
  abstract remove(id: Uuid): Promise<void>;
}
