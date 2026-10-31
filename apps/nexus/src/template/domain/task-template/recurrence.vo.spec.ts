import { DateTime } from 'luxon';
import { Recurrence } from './recurrence.vo';
import { RecurrenceFrequency } from './task-template.enum';

describe('Recurrence', () => {
  const ZONE = 'America/Bogota';

  const day = (iso: string): DateTime => DateTime.fromISO(iso, { zone: ZONE });

  const recurrence = (frequency: RecurrenceFrequency, interval = 1, weekdays: number[] = []): Recurrence =>
    Recurrence.create({ frequency, interval, weekdays, timeZone: ZONE });

  const dueDays = (rule: Recurrence, firstDay: string, from: string, to: string): string[] => {
    const days: string[] = [];

    for (let current = day(from); current <= day(to); current = current.plus({ days: 1 })) {
      if (rule.isDueOn(day(firstDay), current)) days.push(current.toISODate());
    }

    return days;
  };

  it('repeats monthly on the day of the month of the first day', () => {
    const rule = recurrence(RecurrenceFrequency.MONTHLY);

    expect(dueDays(rule, '2026-11-02', '2026-11-01', '2027-01-31')).toEqual(['2026-11-02', '2026-12-02', '2027-01-02']);
  });

  it('falls back to the last day of the month when the month is shorter', () => {
    const rule = recurrence(RecurrenceFrequency.MONTHLY);

    expect(dueDays(rule, '2026-10-31', '2026-10-01', '2027-03-31')).toEqual([
      '2026-10-31',
      '2026-11-30',
      '2026-12-31',
      '2027-01-31',
      '2027-02-28',
      '2027-03-31',
    ]);
  });

  it('skips months between the steps of an interval', () => {
    const rule = recurrence(RecurrenceFrequency.MONTHLY, 2);

    expect(dueDays(rule, '2026-11-24', '2026-11-01', '2027-03-31')).toEqual(['2026-11-24', '2027-01-24', '2027-03-24']);
  });

  it('is never due before the first day', () => {
    const rule = recurrence(RecurrenceFrequency.MONTHLY);

    expect(dueDays(rule, '2026-11-02', '2026-09-01', '2026-10-31')).toEqual([]);
  });

  it('repeats weekly on the weekday of the first day when none is given', () => {
    const rule = recurrence(RecurrenceFrequency.WEEKLY);

    // 2026-03-07 is a Saturday
    expect(dueDays(rule, '2026-03-07', '2026-03-01', '2026-03-31')).toEqual([
      '2026-03-07',
      '2026-03-14',
      '2026-03-21',
      '2026-03-28',
    ]);
  });

  it('repeats weekly on the given weekdays, every other week', () => {
    // Monday and Friday, every 2 weeks, 2026-03-02 is a Monday
    const rule = recurrence(RecurrenceFrequency.WEEKLY, 2, [1, 5]);

    expect(dueDays(rule, '2026-03-02', '2026-03-01', '2026-03-31')).toEqual([
      '2026-03-02',
      '2026-03-06',
      '2026-03-16',
      '2026-03-20',
      '2026-03-30',
    ]);
  });

  it('repeats daily every given number of days', () => {
    const rule = recurrence(RecurrenceFrequency.DAILY, 3);

    expect(dueDays(rule, '2026-03-01', '2026-03-01', '2026-03-10')).toEqual([
      '2026-03-01',
      '2026-03-04',
      '2026-03-07',
      '2026-03-10',
    ]);
  });

  it('repeats yearly, moving 29 February to 28 February in common years', () => {
    const rule = recurrence(RecurrenceFrequency.YEARLY);

    expect(dueDays(rule, '2024-02-29', '2024-01-01', '2026-12-31')).toEqual(['2024-02-29', '2025-02-28', '2026-02-28']);
  });

  it('counts the days in its own time zone, not in the zone of the given instant', () => {
    const rule = recurrence(RecurrenceFrequency.MONTHLY);

    // 03:00 UTC on the 3rd is still the 2nd at 22:00 in Bogota
    const lateNight = DateTime.fromISO('2026-12-03T03:00:00.000Z', { zone: 'utc' });

    expect(rule.isDueOn(day('2026-11-02'), lateNight)).toBe(true);
  });
});
