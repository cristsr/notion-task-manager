import { RecurrenceFrequency } from '@template/domain';
import { KaneoTask } from './kaneo.types';
import { KaneoTaskTemplateMapper } from './kaneo-task-template.mapper';

describe('KaneoTaskTemplateMapper', () => {
  const task = (overrides: Partial<KaneoTask> = {}): KaneoTask => ({
    id: 'tpl-1',
    title: 'Pagar Cuentas',
    description: '- [ ] one',
    priority: 'low',
    dueDate: '2026-11-02T05:00:00.000Z',
    recurrence: { frequency: 'monthly', interval: 1, timeZone: 'America/Bogota' },
    ...overrides,
  });

  it('turns a task with a due date and a repeat rule into a template', () => {
    const template = KaneoTaskTemplateMapper.toDomain(task());

    expect(template).toMatchObject({ id: 'tpl-1', title: 'Pagar Cuentas', description: '- [ ] one', priority: 'low' });
    expect(template.firstDay.toISODate()).toBe('2026-11-02');
    expect(template.recurrence).toMatchObject({
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      weekdays: [],
      timeZone: 'America/Bogota',
    });
  });

  it('keeps the weekdays of a weekly rule', () => {
    const template = KaneoTaskTemplateMapper.toDomain(
      task({ recurrence: { frequency: 'weekly', interval: 2, weekdays: [1, 5], timeZone: 'America/Bogota' } }),
    );

    expect(template.recurrence).toMatchObject({ frequency: RecurrenceFrequency.WEEKLY, interval: 2, weekdays: [1, 5] });
  });

  it('uses an empty description when the task has none', () => {
    expect(KaneoTaskTemplateMapper.toDomain(task({ description: null })).description).toBe('');
  });

  it.each([
    ['without a repeat rule', { recurrence: null }],
    ['without a due date', { dueDate: null }],
  ])('is not a template %s', (_, overrides) => {
    expect(KaneoTaskTemplateMapper.toDomain(task(overrides))).toBeNull();
  });
});
