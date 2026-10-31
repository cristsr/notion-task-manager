import { DateTime, Settings } from 'luxon';
import { Recurrence, RecurrenceFrequency, TaskTemplate } from '@template/domain';
import { RoutineTaskPort, TaskTemplateSourcePort } from '../ports';
import { CreateTemplatedTasksUsecase } from './create-templated-tasks.usecase';

describe('CreateTemplatedTasksUsecase', () => {
  const originalZone = Settings.defaultZone;
  const originalNow = Settings.now;
  const ZONE = 'America/Bogota';

  let source: jest.Mocked<TaskTemplateSourcePort>;
  let routineTasks: jest.Mocked<RoutineTaskPort>;
  let usecase: CreateTemplatedTasksUsecase;

  const at = (iso: string) => {
    // Resolved up front: fromISO reads Settings.now itself, so it cannot run inside the override
    const millis = DateTime.fromISO(iso, { zone: ZONE }).toMillis();
    Settings.now = () => millis;
  };

  const buildTemplate = (id: string, firstDay: string): TaskTemplate =>
    TaskTemplate.create({
      id,
      title: `Template ${id}`,
      description: '- [ ] one\n- [ ] two',
      priority: 'low',
      firstDay: DateTime.fromISO(firstDay, { zone: ZONE }),
      recurrence: Recurrence.create({
        frequency: RecurrenceFrequency.MONTHLY,
        interval: 1,
        weekdays: [],
        timeZone: ZONE,
      }),
    });

  beforeAll(() => {
    Settings.defaultZone = ZONE;
  });

  afterAll(() => {
    Settings.defaultZone = originalZone;
    Settings.now = originalNow;
  });

  beforeEach(() => {
    source = { fetchAll: jest.fn() };
    routineTasks = { existsDueOn: jest.fn().mockResolvedValue(false), create: jest.fn().mockResolvedValue(undefined) };
    usecase = new CreateTemplatedTasksUsecase(source, routineTasks);
  });

  it('creates the task of a template that is due today', async () => {
    at('2026-12-02T09:00:00');
    const template = buildTemplate('a', '2026-11-02');
    source.fetchAll.mockResolvedValue([template]);

    await usecase.execute();

    expect(routineTasks.create).toHaveBeenCalledTimes(1);
    expect(routineTasks.create).toHaveBeenCalledWith(template, expect.any(DateTime));
  });

  it('does not create the task of a template that is not due today', async () => {
    at('2026-12-03T09:00:00');
    source.fetchAll.mockResolvedValue([buildTemplate('a', '2026-11-02')]);

    await usecase.execute();

    expect(routineTasks.existsDueOn).not.toHaveBeenCalled();
    expect(routineTasks.create).not.toHaveBeenCalled();
  });

  it('does not create the task again when it already exists', async () => {
    at('2026-12-02T15:00:00');
    source.fetchAll.mockResolvedValue([buildTemplate('a', '2026-11-02')]);
    routineTasks.existsDueOn.mockResolvedValue(true);

    await usecase.execute();

    expect(routineTasks.create).not.toHaveBeenCalled();
  });

  it('waits for the creation hour before doing anything', async () => {
    at('2026-12-02T07:59:00');

    await usecase.execute();

    expect(source.fetchAll).not.toHaveBeenCalled();
  });

  it('keeps going with the other templates when one of them fails', async () => {
    at('2026-12-02T09:00:00');
    const failing = buildTemplate('failing', '2026-11-02');
    const healthy = buildTemplate('healthy', '2026-11-02');
    source.fetchAll.mockResolvedValue([failing, healthy]);
    routineTasks.create.mockRejectedValueOnce(new Error('Kaneo is down'));

    await usecase.execute();

    expect(routineTasks.create).toHaveBeenCalledTimes(2);
    expect(routineTasks.create).toHaveBeenLastCalledWith(healthy, expect.any(DateTime));
  });

  it('lets the failure to read the templates reach the caller', async () => {
    at('2026-12-02T09:00:00');
    source.fetchAll.mockRejectedValue(new Error('Kaneo is down'));

    await expect(usecase.execute()).rejects.toThrow('Kaneo is down');
  });
});
