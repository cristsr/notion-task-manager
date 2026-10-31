import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { RoutineTaskPort } from '@template/application/ports';
import { TaskTemplate } from '@template/domain';
import { KaneoClient } from './kaneo.client';

@Injectable()
export class KaneoRoutineTaskProvider implements RoutineTaskPort {
  /**
   * Column in which the created tasks start, when the deployment does not say otherwise
   */
  private static readonly DEFAULT_STATUS = 'to-do';

  constructor(
    private readonly client: KaneoClient,
    private readonly config: ConfigService,
  ) {}

  async existsDueOn(template: TaskTemplate, day: DateTime): Promise<boolean> {
    const { open, archived } = await this.client.fetchBoard(this.projectId());

    const { timeZone } = template.recurrence;
    const date = day.setZone(timeZone).toISODate();

    return [...open, ...archived].some(
      (task) =>
        task.title === template.title &&
        !!task.dueDate &&
        DateTime.fromISO(task.dueDate, { zone: timeZone }).toISODate() === date,
    );
  }

  async create(template: TaskTemplate, day: DateTime): Promise<void> {
    await this.client.createTask(this.projectId(), {
      title: template.title,
      description: template.description,
      priority: template.priority,
      status: this.config.get('KANEO_TASK_STATUS', KaneoRoutineTaskProvider.DEFAULT_STATUS),
      dueDate: day.setZone(template.recurrence.timeZone).startOf('day').toUTC().toISO(),
    });
  }

  private projectId(): string {
    return this.config.get('KANEO_DAILY_PROJECT_ID');
  }
}
