import { DateTime } from 'luxon';
import { PropertiesOnly } from '@shared/domain/types';
import { Recurrence } from './recurrence.vo';

export class TaskTemplate {
  /**
   * Task template unique identifier in the task manager
   */
  id: string;

  /**
   * Title given to every task created from the template
   */
  title: string;

  /**
   * Description given to every task created from the template
   */
  description: string;

  /**
   * Priority given to every task created from the template, as the task manager names it
   */
  priority: string;

  /**
   * First day of the schedule, the recurrence counts its steps from it
   */
  firstDay: DateTime;

  /**
   * Schedule on which the template creates tasks
   */
  recurrence: Recurrence;

  private constructor(payload?: Partial<TaskTemplate>) {
    Object.assign(this, payload);
  }

  /**
   * Create a task template instance
   * @param payload
   */
  static create(payload: PropertiesOnly<TaskTemplate>): TaskTemplate {
    return new TaskTemplate(payload);
  }

  /**
   * Check if the template must create a task on the given day
   * @param day
   */
  isDueOn(day: DateTime): boolean {
    return this.recurrence.isDueOn(this.firstDay, day);
  }
}
