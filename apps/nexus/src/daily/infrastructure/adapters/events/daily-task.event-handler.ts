import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { match } from 'ts-pattern';
import { NotionEventInput, NotionEventType } from '@shared/infrastructure/dtos';
import { Uuid } from '@shared/domain/value-objects';
import { ErrorLogFormatter } from '@shared/application/logging';
import { RemoveDailyTaskUsecase, SyncDailyTaskUsecase } from '@daily/application/usecases';

@Injectable()
export class DailyTaskEventHandler {
  private readonly logger = new Logger(DailyTaskEventHandler.name);

  private readonly taskDatasource: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly syncTaskUsecase: SyncDailyTaskUsecase,
    private readonly removeTasksUsecase: RemoveDailyTaskUsecase,
  ) {
    this.taskDatasource = this.configService.get('NOTION_TASK_DATASOURCE');
  }

  @OnEvent('notion.event')
  async onNotionEvent(event: NotionEventInput): Promise<void> {
    const datasourceId = event.data?.parent?.data_source_id;

    if (datasourceId !== this.taskDatasource) return;

    const taskId = Uuid.create(event.entity.id);

    try {
      await match(event.type)
        .with(NotionEventType.PAGE_CREATED, () => this.syncTaskUsecase.execute(taskId))
        .with(NotionEventType.PAGE_PROPERTIES_UPDATED, () => this.syncTaskUsecase.execute(taskId))
        .with(NotionEventType.PAGE_UNDELETED, () => this.syncTaskUsecase.execute(taskId))
        .with(NotionEventType.PAGE_DELETED, () => this.removeTasksUsecase.execute(taskId))
        .exhaustive();
    } catch (error) {
      this.logger.error(ErrorLogFormatter.format(error));
    }
  }
}
