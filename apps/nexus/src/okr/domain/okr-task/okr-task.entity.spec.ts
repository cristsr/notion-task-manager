import { DateTime, Settings } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { PropertiesOnly } from '@shared/domain/types';
import { OkrTask } from './okr-task.entity';
import { OkrTaskStatus } from './okr-task.enum';

describe('OkrTask', () => {
  const originalNow = Settings.now;
  const NOW = DateTime.fromISO('2026-08-07T10:00:00.000Z', { zone: 'utc' });

  const buildTask = (overrides: Partial<PropertiesOnly<OkrTask>> = {}): OkrTask =>
    OkrTask.create({
      id: Uuid.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301'),
      keyResultId: null,
      objectiveId: null,
      updatedAt: NOW.minus({ days: 1 }),
      status: OkrTaskStatus.PENDING,
      progress: 0,
      ...overrides,
    });

  beforeAll(() => {
    Settings.now = () => NOW.toMillis();
  });

  afterAll(() => {
    Settings.now = originalNow;
  });

  describe('syncProgressWithStatus', () => {
    it('starts progress when the task moved to in progress', () => {
      const task = buildTask({ status: OkrTaskStatus.IN_PROGRESS, progress: 0 });

      expect(task.syncProgressWithStatus()).toBe(true);
      expect(task.progress).toBe(0.1);
    });

    it('completes progress when a started task is done', () => {
      const task = buildTask({ status: OkrTaskStatus.DONE, progress: 0.1 });

      expect(task.syncProgressWithStatus()).toBe(true);
      expect(task.progress).toBe(1);
    });

    it('is idempotent for an already completed task', () => {
      const task = buildTask({ status: OkrTaskStatus.DONE, progress: 1 });

      expect(task.syncProgressWithStatus()).toBe(false);
      expect(task.progress).toBe(1);
    });

    it('leaves an in progress task that already has progress untouched', () => {
      const task = buildTask({ status: OkrTaskStatus.IN_PROGRESS, progress: 0.5 });

      expect(task.syncProgressWithStatus()).toBe(false);
      expect(task.progress).toBe(0.5);
    });

    it('leaves a pending task untouched', () => {
      const task = buildTask({ status: OkrTaskStatus.PENDING, progress: 0 });

      expect(task.syncProgressWithStatus()).toBe(false);
      expect(task.progress).toBe(0);
    });
  });

  describe('state helpers', () => {
    it('reports done status', () => {
      expect(buildTask({ status: OkrTaskStatus.DONE }).isDone()).toBe(true);
      expect(buildTask({ status: OkrTaskStatus.PENDING }).isDone()).toBe(false);
    });

    it('reports whether it has progress', () => {
      expect(buildTask({ progress: 0 }).hasProgress()).toBe(false);
      expect(buildTask({ progress: 0.1 }).hasProgress()).toBe(true);
    });

    it('stamps the update time', () => {
      const task = buildTask();

      task.markAsUpdated();

      expect(task.updatedAt.toMillis()).toBe(NOW.toMillis());
    });
  });
});
