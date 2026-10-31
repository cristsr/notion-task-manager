import { DateTime } from 'luxon';
import { Nullable } from '@shared/domain/types';
import { Recurrence, RecurrenceFrequency, TaskTemplate } from '@template/domain';
import { KaneoTask } from './kaneo.types';

export class KaneoTaskTemplateMapper {
  /**
   * A Kaneo task is a template only when it says when to start and how to repeat
   * @param task
   */
  static toDomain(task: KaneoTask): Nullable<TaskTemplate> {
    if (!task.dueDate || !task.recurrence) return null;

    const { frequency, interval, weekdays, timeZone } = task.recurrence;

    return TaskTemplate.create({
      id: task.id,
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      firstDay: DateTime.fromISO(task.dueDate, { zone: timeZone }),
      recurrence: Recurrence.create({
        frequency: RecurrenceFrequency[frequency.toUpperCase()],
        interval,
        weekdays: weekdays ?? [],
        timeZone,
      }),
    });
  }
}
