import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { ErrorLogFormatter } from '@shared/application/logging';
import { RoutineTaskPort, TaskTemplateSourcePort } from '../ports';

@Injectable()
export class CreateTemplatedTasksUsecase {
  /**
   * Local hour from which the tasks of the day are created, so they do not show up at midnight
   */
  private static readonly CREATION_HOUR = 8;

  private readonly logger = new Logger(CreateTemplatedTasksUsecase.name);

  constructor(
    private readonly templateSource: TaskTemplateSourcePort,
    private readonly routineTasks: RoutineTaskPort,
  ) {}

  /**
   * Create the tasks of the templates that are due today.
   * It is safe to run it many times a day: a task that already exists is not created again.
   */
  async execute(): Promise<void> {
    const now = DateTime.local();

    if (now.hour < CreateTemplatedTasksUsecase.CREATION_HOUR) return;

    const templates = await this.templateSource.fetchAll();

    for (const template of templates) {
      if (!template.isDueOn(now)) continue;

      try {
        if (await this.routineTasks.existsDueOn(template, now)) continue;

        await this.routineTasks.create(template, now);

        this.logger.log(`Task created from template [${template.id}] ${template.title}`);
      } catch (error) {
        // A failing template must not stop the others, it is retried on the next run
        this.logger.error(ErrorLogFormatter.format(error));
      }
    }
  }
}
