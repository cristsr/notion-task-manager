import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { DailyTask } from './daily-task.entity';

export abstract class DailyTaskRepository {
  abstract getAllTask(): Promise<DailyTask[]>;
  abstract save(task: DailyTask): Promise<void>;
  abstract insert(task: DailyTask): Promise<void>;
  abstract update(task: DailyTask): Promise<void>;
  abstract findById(id: Uuid): Promise<Nullable<DailyTask>>;
  abstract remove(task: DailyTask): Promise<void>;
}
