import { DailyTask } from '../index';
import { Uuid } from '@shared/domain/value-objects';

export abstract class DailyTaskRepository {
  abstract getAllTask(): Promise<DailyTask[]>;
  abstract save(task: DailyTask): Promise<void>;
  abstract insert(task: DailyTask): Promise<void>;
  abstract update(task: DailyTask): Promise<void>;
  abstract findById(id: Uuid): Promise<DailyTask>;
  abstract remove(task: DailyTask): Promise<void>;
}
