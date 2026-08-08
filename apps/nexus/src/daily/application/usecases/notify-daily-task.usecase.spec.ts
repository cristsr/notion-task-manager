import { DateTime, Settings } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { DailyTask, DailyTaskPriority, DailyTaskRepository, DailyTaskStatus, DailyTaskType } from '@daily/domain';
import { DailyTaskNotifierPort } from '../ports';
import { NotifyDailyTaskUsecase } from './notify-daily-task.usecase';

describe('NotifyDailyTaskUsecase', () => {
  const originalZone = Settings.defaultZone;
  const originalNow = Settings.now;
  const NOW = DateTime.fromISO('2026-08-07T10:00:00.000Z', { zone: 'utc' });

  let repository: jest.Mocked<DailyTaskRepository>;
  let notifier: jest.Mocked<DailyTaskNotifierPort>;
  let usecase: NotifyDailyTaskUsecase;

  const buildTask = (id: string, minutesAhead: number): DailyTask =>
    DailyTask.create({
      id: Uuid.create(id),
      title: `Task ${id}`,
      date: NOW.plus({ minutes: minutesAhead }),
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
    });

  const FIRST = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  const SECOND = '0b8a6501-1c1f-4b8e-8b64-7a1a2f3c4d5e';

  beforeAll(() => {
    Settings.defaultZone = 'utc';
    Settings.now = () => NOW.toMillis();
  });

  afterAll(() => {
    Settings.defaultZone = originalZone;
    Settings.now = originalNow;
  });

  beforeEach(() => {
    repository = {
      getAllTask: jest.fn(),
      save: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<DailyTaskRepository>;
    notifier = { notify: jest.fn() } as unknown as jest.Mocked<DailyTaskNotifierPort>;

    usecase = new NotifyDailyTaskUsecase(repository, notifier);

    jest.spyOn(usecase['logger'], 'log').mockImplementation();
    jest.spyOn(usecase['logger'], 'error').mockImplementation();
  });

  it('skips tasks that are not due for notification', async () => {
    repository.getAllTask.mockResolvedValue([buildTask(FIRST, 60 * 30)]);

    await usecase.execute();

    expect(notifier.notify).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('marks the task as notified only after a successful delivery', async () => {
    const task = buildTask(FIRST, 10);
    repository.getAllTask.mockResolvedValue([task]);
    notifier.notify.mockResolvedValue(undefined);

    await usecase.execute();

    expect(notifier.notify).toHaveBeenCalledWith(task);
    expect(task.notifiedAt).not.toBeNull();
    expect(repository.save).toHaveBeenCalledWith(task);
  });

  it('does not mark the task as notified when the delivery fails', async () => {
    const task = buildTask(FIRST, 10);
    repository.getAllTask.mockResolvedValue([task]);
    notifier.notify.mockRejectedValue(new Error('discord down'));

    await usecase.execute();

    expect(task.notifiedAt).toBeNull();
    expect(task.notificationStages).toEqual([]);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('keeps processing the batch after one task fails', async () => {
    const failing = buildTask(FIRST, 10);
    const healthy = buildTask(SECOND, 10);
    repository.getAllTask.mockResolvedValue([failing, healthy]);
    notifier.notify.mockRejectedValueOnce(new Error('discord down')).mockResolvedValueOnce(undefined);

    await usecase.execute();

    expect(notifier.notify).toHaveBeenCalledTimes(2);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(healthy);
  });
});
