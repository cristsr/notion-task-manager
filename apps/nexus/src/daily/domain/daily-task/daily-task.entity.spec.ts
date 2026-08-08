import { DateTime, Settings } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { PropertiesOnly } from '@shared/domain/types';
import { DailyTask } from './daily-task.entity';
import { DailyNotificationStage, DailyTaskPriority, DailyTaskStatus, DailyTaskType } from './daily-task.enum';

describe('DailyTask', () => {
  const originalZone = Settings.defaultZone;
  const originalNow = Settings.now;

  // Fixed instant inside the notification window (08:00–23:59)
  const NOW = DateTime.fromISO('2026-08-07T10:00:00.000Z', { zone: 'utc' });

  const buildTask = (overrides: Partial<PropertiesOnly<DailyTask>> = {}): DailyTask =>
    DailyTask.create({
      id: Uuid.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301'),
      title: 'Write the audit',
      date: NOW.plus({ hours: 5 }),
      status: DailyTaskStatus.NOT_STARTED,
      priority: DailyTaskPriority.MEDIUM,
      type: DailyTaskType.NORMAL,
      assignedTo: 'styve',
      createdBy: 'styve',
      createdAt: NOW.minus({ days: 1 }),
      url: 'https://notion.so/task',
      hidden: false,
      notificationStages: [],
      notifiedAt: null,
      ...overrides,
    });

  beforeAll(() => {
    Settings.defaultZone = 'utc';
    Settings.now = () => NOW.toMillis();
  });

  afterAll(() => {
    Settings.defaultZone = originalZone;
    Settings.now = originalNow;
  });

  describe('shouldNotify', () => {
    it('is false outside the 08:00–24:00 window', () => {
      const earlyMorning = DateTime.fromISO('2026-08-07T03:00:00.000Z', { zone: 'utc' });
      Settings.now = () => earlyMorning.toMillis();

      const task = buildTask({ date: earlyMorning.plus({ minutes: 10 }) });

      expect(task.shouldNotify()).toBe(false);

      Settings.now = () => NOW.toMillis();
    });

    it('is true within 15 minutes when that stage was not sent', () => {
      const task = buildTask({ date: NOW.plus({ minutes: 10 }) });

      expect(task.shouldNotify()).toBe(true);
    });

    it('is false within 15 minutes once that stage was sent', () => {
      const task = buildTask({
        date: NOW.plus({ minutes: 10 }),
        notificationStages: [DailyNotificationStage.BEFORE_15_MINUTES],
      });

      expect(task.shouldNotify()).toBe(false);
    });

    it('is true within an hour when only the 24h stage was sent', () => {
      const task = buildTask({
        date: NOW.plus({ minutes: 45 }),
        notificationStages: [DailyNotificationStage.BEFORE_24_HOURS],
      });

      expect(task.shouldNotify()).toBe(true);
    });

    it('is false beyond 24 hours', () => {
      const task = buildTask({ date: NOW.plus({ hours: 30 }) });

      expect(task.shouldNotify()).toBe(false);
    });

    describe('when the date already passed', () => {
      it('never re-notifies a scheduled task', () => {
        const task = buildTask({ date: NOW.minus({ hours: 2 }), type: DailyTaskType.SCHEDULED });

        expect(task.shouldNotify()).toBe(false);
      });

      it('notifies an overdue task that was never notified', () => {
        const task = buildTask({ date: NOW.minus({ hours: 2 }), notifiedAt: null });

        expect(task.shouldNotify()).toBe(true);
      });

      it('waits more than an hour between overdue reminders', () => {
        const task = buildTask({ date: NOW.minus({ hours: 2 }), notifiedAt: NOW.minus({ minutes: 30 }) });

        expect(task.shouldNotify()).toBe(false);
      });

      it('re-notifies an overdue task after more than an hour', () => {
        const task = buildTask({ date: NOW.minus({ hours: 4 }), notifiedAt: NOW.minus({ hours: 2 }) });

        expect(task.shouldNotify()).toBe(true);
      });
    });
  });

  describe('getNotificationStage', () => {
    it.each([
      [{ minutes: 10 }, DailyNotificationStage.BEFORE_15_MINUTES],
      [{ minutes: 50 }, DailyNotificationStage.BEFORE_1_HOUR],
      [{ hours: 10 }, DailyNotificationStage.BEFORE_24_HOURS],
    ])('resolves %o ahead to %s', (ahead, expected) => {
      expect(buildTask({ date: NOW.plus(ahead) }).getNotificationStage()).toBe(expected);
    });

    it('resolves a past date to AFTER_NOW', () => {
      expect(buildTask({ date: NOW.minus({ hours: 1 }) }).getNotificationStage()).toBe(
        DailyNotificationStage.AFTER_NOW,
      );
    });
  });

  describe('notify', () => {
    it('records the current stage and the notification timestamp', () => {
      const task = buildTask({ date: NOW.plus({ minutes: 10 }) });

      task.notify();

      expect(task.notificationStages).toEqual([DailyNotificationStage.BEFORE_15_MINUTES]);
      expect(task.notifiedAt?.toMillis()).toBe(NOW.toMillis());
    });

    it('does not duplicate a stage already recorded', () => {
      const task = buildTask({ date: NOW.plus({ minutes: 10 }) });

      task.notify();
      task.notify();

      expect(task.notificationStages).toEqual([DailyNotificationStage.BEFORE_15_MINUTES]);
    });
  });

  describe('mustBeVisible', () => {
    it('is false for an already visible task', () => {
      expect(buildTask({ hidden: false, date: NOW.plus({ hours: 1 }) }).mustBeVisible()).toBe(false);
    });

    it('is true for a hidden task inside the 48h window', () => {
      expect(buildTask({ hidden: true, date: NOW.plus({ hours: 47 }) }).mustBeVisible()).toBe(true);
    });

    it('is false for a hidden task beyond the 48h window', () => {
      expect(buildTask({ hidden: true, date: NOW.plus({ hours: 49 }) }).mustBeVisible()).toBe(false);
    });
  });

  describe('state helpers', () => {
    it('reports done status', () => {
      expect(buildTask({ status: DailyTaskStatus.DONE }).isDone()).toBe(true);
      expect(buildTask({ status: DailyTaskStatus.IN_PROGRESS }).isDone()).toBe(false);
    });

    it('toggles visibility', () => {
      const task = buildTask({ hidden: true });

      task.setVisible(true);

      expect(task.isVisible()).toBe(true);
      expect(task.hidden).toBe(false);
    });

    it('applies a partial update', () => {
      const task = buildTask({ title: 'old' });

      task.update({ title: 'new', status: DailyTaskStatus.DONE });

      expect(task.title).toBe('new');
      expect(task.status).toBe(DailyTaskStatus.DONE);
      expect(task.assignedTo).toBe('styve');
    });
  });
});
