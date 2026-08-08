import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable, PropertiesOnly } from '@shared/domain/types';
import { DailyNotificationStage, DailyTaskPriority, DailyTaskStatus, DailyTaskType } from './daily-task.enum';

export class DailyTask {
  /**
   * Hours before its date within which a hidden daily task becomes visible again
   */
  private static readonly VISIBILITY_WINDOW_HOURS = 48;

  /**
   * Daily task unique identifier
   */
  id: Uuid;

  /**
   * Daily task title
   */
  title: string;

  /**
   * Daily task date
   */
  date: DateTime;

  /**
   * Daily task status
   */
  status: DailyTaskStatus;

  /**
   * Daily task priority
   */
  priority: DailyTaskPriority;

  /**
   * Daily task type
   */
  type: DailyTaskType;

  /**
   * Daily task assigned to
   */
  assignedTo: string;

  /**
   * Daily task created by
   */
  createdBy: string;

  /**
   * Daily task created at timestamp
   */
  createdAt: DateTime;

  /**
   * Daily task url
   */
  url: string;

  /**
   * Daily task hidden to handle visibility logic
   */
  hidden: boolean;

  /**
   * Daily task notification stages used for notification
   */
  notificationStages: DailyNotificationStage[];

  /**
   * Daily task last notified at timestamp
   */
  notifiedAt: Nullable<DateTime>;

  private constructor(payload?: Partial<DailyTask>) {
    Object.assign(this, payload);
  }

  /**
   * Create a daily task instance
   * @param payload
   */
  static create(payload: PropertiesOnly<DailyTask>): DailyTask {
    return new DailyTask(payload);
  }

  /**
   * Updates daily task properties, it could be partial
   * @param payload
   */
  update(payload: Partial<PropertiesOnly<DailyTask>>): void {
    Object.assign(this, payload);
  }

  /**
   * Check if daily task should be notified
   */
  shouldNotify(): boolean {
    const now = DateTime.local();
    const diff = this.date.diff(DateTime.local());

    if (!(now.hour >= 8 && now.hour < 24)) return false;

    if (diff.as('hours') < 0) {
      if (this.type === DailyTaskType.SCHEDULED) return false;

      if (!this.notifiedAt) return true;

      return DateTime.local().diff(this.notifiedAt).as('hours') > 1;
    }

    if (diff.as('minutes') <= 15) {
      return !this.notificationStages.includes(
        DailyNotificationStage.BEFORE_15_MINUTES,
      );
    }

    if (diff.as('hours') <= 1) {
      return !this.notificationStages.includes(
        DailyNotificationStage.BEFORE_1_HOUR,
      );
    }

    if (diff.as('hours') <= 24) {
      return !this.notificationStages.includes(
        DailyNotificationStage.BEFORE_24_HOURS,
      );
    }

    return false;
  }

  /**
   * Get notification stage based on current time
   */
  getNotificationStage(): DailyNotificationStage {
    const diff = this.date.diff(DateTime.local());

    if (diff.as('hours') < 0) {
      return DailyNotificationStage.AFTER_NOW;
    }

    if (diff.as('minutes') <= 15) {
      return DailyNotificationStage.BEFORE_15_MINUTES;
    }

    if (diff.as('hours') <= 1) {
      return DailyNotificationStage.BEFORE_1_HOUR;
    }

    return DailyNotificationStage.BEFORE_24_HOURS;
  }

  /**
   * Mark a daily task as notified with current notification stage based on current time
   */
  notify() {
    const stage = this.getNotificationStage();
    this.addNotificationStage(stage);
    this.notifiedAt = DateTime.local();
  }

  /**
   * Check if a daily task must be visible, based on how close its date is
   */
  mustBeVisible(): boolean {
    if (this.isVisible()) return false;

    const diff = this.date.diff(DateTime.local());

    return diff.as('hours') <= DailyTask.VISIBILITY_WINDOW_HOURS;
  }

  /**
   * Check if a daily task is done
   */
  isDone(): boolean {
    return this.status === DailyTaskStatus.DONE;
  }

  /**
   * Check if a daily task is visible
   */
  isVisible(): boolean {
    return !this.hidden;
  }

  /**
   * Set daily task visibility
   * @param visible
   */
  setVisible(visible: boolean) {
    this.hidden = !visible;
  }

  /**
   * Add a notification stage to a daily task, verifying if it already exists
   * @param stage
   */
  private addNotificationStage(stage: DailyNotificationStage): void {
    if (this.notificationStages.includes(stage)) return;
    this.notificationStages.push(stage);
  }
}
