import { DateTime } from 'luxon';
import { match } from 'ts-pattern';
import { PropertiesOnly } from '@shared/domain/types';
import { RecurrenceFrequency } from './task-template.enum';

export class Recurrence {
  /**
   * Repeat every this many days, weeks, months or years
   */
  readonly interval: number;

  readonly frequency: RecurrenceFrequency;

  /**
   * Weekly only: days to repeat on, 0 for Sunday to 6 for Saturday. Empty means the weekday of the first day
   */
  readonly weekdays: number[];

  /**
   * IANA time zone in which the calendar days are counted
   */
  readonly timeZone: string;

  private constructor(payload: PropertiesOnly<Recurrence>) {
    Object.assign(this, payload);
  }

  /**
   * Create a recurrence instance
   * @param payload
   */
  static create(payload: PropertiesOnly<Recurrence>): Recurrence {
    return new Recurrence(payload);
  }

  /**
   * Check if a day is one of the days of the schedule that starts on `firstDay`.
   * Months without the day of the month fall back to their last day, so the 31st also runs in February.
   * @param firstDay
   * @param day
   */
  isDueOn(firstDay: DateTime, day: DateTime): boolean {
    const start = firstDay.setZone(this.timeZone).startOf('day');
    const target = day.setZone(this.timeZone).startOf('day');

    if (target < start) return false;

    const sameDayOfMonth = target.day === Math.min(start.day, target.daysInMonth);

    return match(this.frequency)
      .with(RecurrenceFrequency.DAILY, () => this.isStep(Math.round(target.diff(start, 'days').days)))
      .with(RecurrenceFrequency.WEEKLY, () => {
        const weekdays = this.weekdays.length ? this.weekdays : [start.weekday % 7];
        const days = Math.round(target.startOf('week').diff(start.startOf('week'), 'days').days);

        return weekdays.includes(target.weekday % 7) && this.isStep(days / 7);
      })
      .with(RecurrenceFrequency.MONTHLY, () => {
        const months = (target.year - start.year) * 12 + target.month - start.month;

        return sameDayOfMonth && this.isStep(months);
      })
      .with(RecurrenceFrequency.YEARLY, () => {
        return sameDayOfMonth && target.month === start.month && this.isStep(target.year - start.year);
      })
      .exhaustive();
  }

  private isStep(elapsed: number): boolean {
    return elapsed % this.interval === 0;
  }
}
