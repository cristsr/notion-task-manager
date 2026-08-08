import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { NotionEventInput, NotionEventType } from '@shared/infrastructure/dtos';
import { Uuid } from '@shared/domain/value-objects';
import { SyncOkrTaskObjectiveUsecase, SyncOkrTaskStatusUsecase, RemoveOkrTaskUsecase } from '@okr/application/usecases';
import { match } from 'ts-pattern';
import { ErrorLogFormatter } from '@shared/application/logging';

@Injectable()
export class OkrTaskEventHandler {
  private readonly logger = new Logger(OkrTaskEventHandler.name);

  private readonly taskDatasource: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly syncOkrTaskUsecase: SyncOkrTaskObjectiveUsecase,
    private readonly syncOkrTaskStatusUsecase: SyncOkrTaskStatusUsecase,
    private readonly removeOkrTaskUsecase: RemoveOkrTaskUsecase,
  ) {
    this.taskDatasource = this.configService.get('NOTION_OKR_TASK_DATASOURCE');
  }

  @OnEvent('notion.event')
  async onNotionEvent(event: NotionEventInput): Promise<void> {
    const datasourceId = event.data?.parent?.data_source_id;

    if (datasourceId === this.taskDatasource) {
      const taskId = Uuid.create(event.entity.id);

      try {
        await match(event.type)
          .with(NotionEventType.PAGE_CREATED, async () => {
            await this.syncOkrTaskUsecase.execute(taskId);
            await this.syncOkrTaskStatusUsecase.execute(taskId);
          })
          .with(NotionEventType.PAGE_PROPERTIES_UPDATED, async () => {
            await this.syncOkrTaskUsecase.execute(taskId);
            await this.syncOkrTaskStatusUsecase.execute(taskId);
          })
          .with(NotionEventType.PAGE_UNDELETED, () => this.syncOkrTaskUsecase.execute(taskId))
          .with(NotionEventType.PAGE_DELETED, () => this.removeOkrTaskUsecase.execute(taskId))
          .exhaustive();
      } catch (error) {
        this.logger.error(ErrorLogFormatter.format(error));
      }
    }
  }
}
