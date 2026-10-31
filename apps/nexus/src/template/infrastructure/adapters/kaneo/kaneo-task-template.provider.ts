import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TaskTemplateSourcePort } from '@template/application/ports';
import { TaskTemplate } from '@template/domain';
import { KaneoClient } from './kaneo.client';
import { KaneoTaskTemplateMapper } from './kaneo-task-template.mapper';

@Injectable()
export class KaneoTaskTemplateProvider implements TaskTemplateSourcePort {
  private readonly logger = new Logger(KaneoTaskTemplateProvider.name);

  constructor(
    private readonly client: KaneoClient,
    private readonly config: ConfigService,
  ) {}

  async fetchAll(): Promise<TaskTemplate[]> {
    const { open } = await this.client.fetchBoard(this.config.get('KANEO_TEMPLATE_PROJECT_ID'));

    const templates: TaskTemplate[] = [];

    for (const task of open) {
      const template = KaneoTaskTemplateMapper.toDomain(task);

      if (!template) {
        this.logger.warn(`Template [${task.id}] ${task.title} skipped: it needs a due date and a repeat rule`);
        continue;
      }

      templates.push(template);
    }

    return templates;
  }
}
