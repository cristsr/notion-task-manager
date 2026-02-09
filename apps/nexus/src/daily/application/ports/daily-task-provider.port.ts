import { DailyTask } from '@daily/domain';
import { Uuid } from '@shared/domain/value-objects';

export abstract class DailyTaskProviderPort {
  /**
   * Fetch all daily tasks from provider
   */
  abstract fetchAll(): Promise<DailyTask[]>;

  /**
   * Fetch daily task by id
   * @param id
   */
  abstract fetchById(id: Uuid): Promise<DailyTask>;

  /**
   * Update daily task in provider
   * @param task
   */
  abstract update(task: DailyTask): Promise<void>;
}
