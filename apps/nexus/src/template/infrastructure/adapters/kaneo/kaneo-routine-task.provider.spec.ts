import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { Recurrence, RecurrenceFrequency, TaskTemplate } from '@template/domain';
import { KaneoClient } from './kaneo.client';
import { KaneoTask } from './kaneo.types';
import { KaneoRoutineTaskProvider } from './kaneo-routine-task.provider';

describe('KaneoRoutineTaskProvider', () => {
  const ZONE = 'America/Bogota';

  const template = TaskTemplate.create({
    id: 'tpl-1',
    title: 'Pagar Cuentas',
    description: '- [ ] one',
    priority: 'low',
    firstDay: DateTime.fromISO('2026-11-02', { zone: ZONE }),
    recurrence: Recurrence.create({
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      weekdays: [],
      timeZone: ZONE,
    }),
  });

  // 22:00 on the 2nd in Bogota is already the 3rd in UTC
  const day = DateTime.fromISO('2026-12-02T22:00:00', { zone: ZONE });

  const task = (title: string, dueDate: string | null): KaneoTask => ({
    id: title,
    title,
    description: null,
    priority: 'low',
    dueDate,
    recurrence: null,
  });

  let client: jest.Mocked<Pick<KaneoClient, 'fetchBoard' | 'createTask'>>;
  let settings: Record<string, string>;
  let provider: KaneoRoutineTaskProvider;

  beforeEach(() => {
    client = { fetchBoard: jest.fn(), createTask: jest.fn().mockResolvedValue(undefined) };
    settings = { KANEO_DAILY_PROJECT_ID: 'daily-1' };

    const config = { get: (key: string, fallback?: string) => settings[key] ?? fallback };

    provider = new KaneoRoutineTaskProvider(client as unknown as KaneoClient, config as unknown as ConfigService);
  });

  describe('existsDueOn', () => {
    it('finds an open task with the same title due that day', async () => {
      client.fetchBoard.mockResolvedValue({
        open: [task('Pagar Cuentas', '2026-12-02T05:00:00.000Z')],
        archived: [],
      });

      await expect(provider.existsDueOn(template, day)).resolves.toBe(true);
      expect(client.fetchBoard).toHaveBeenCalledWith('daily-1');
    });

    it('finds a task that was already completed and archived', async () => {
      client.fetchBoard.mockResolvedValue({
        open: [],
        archived: [task('Pagar Cuentas', '2026-12-02T05:00:00.000Z')],
      });

      await expect(provider.existsDueOn(template, day)).resolves.toBe(true);
    });

    it('does not mix up another title, another day or a task without a due date', async () => {
      client.fetchBoard.mockResolvedValue({
        open: [
          task('Otra cosa', '2026-12-02T05:00:00.000Z'),
          task('Pagar Cuentas', '2026-11-02T05:00:00.000Z'),
          task('Pagar Cuentas', null),
        ],
        archived: [],
      });

      await expect(provider.existsDueOn(template, day)).resolves.toBe(false);
    });
  });

  describe('create', () => {
    it('creates the task due at the start of the day in the template zone, in the configured column', async () => {
      settings.KANEO_TASK_STATUS = 'backlog';

      await provider.create(template, day);

      expect(client.createTask).toHaveBeenCalledWith('daily-1', {
        title: 'Pagar Cuentas',
        description: '- [ ] one',
        priority: 'low',
        status: 'backlog',
        dueDate: '2026-12-02T05:00:00.000Z',
      });
    });

    it('starts the task in to-do when no column is configured', async () => {
      await provider.create(template, day);

      expect(client.createTask).toHaveBeenCalledWith('daily-1', expect.objectContaining({ status: 'to-do' }));
    });
  });
});
