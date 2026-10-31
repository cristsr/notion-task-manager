import { DateTime } from 'luxon';
import { TaskTemplate } from '@template/domain';

export abstract class RoutineTaskPort {
  /**
   * Check if a task created from the template already exists for the day, completed or not
   * @param template
   * @param day
   */
  abstract existsDueOn(template: TaskTemplate, day: DateTime): Promise<boolean>;

  /**
   * Create a task from the template, due on the given day
   * @param template
   * @param day
   */
  abstract create(template: TaskTemplate, day: DateTime): Promise<void>;
}
