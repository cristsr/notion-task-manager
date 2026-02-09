import { DailyTask } from '@daily/domain';

export abstract class DailyTaskNotifierPort {
  /**
   * Should notify daily task to user
   * @param task
   */
  abstract notify(task: DailyTask): Promise<void>;
}
