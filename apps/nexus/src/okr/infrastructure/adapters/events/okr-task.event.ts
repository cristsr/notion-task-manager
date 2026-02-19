import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { NotionEventInput, NotionEventType } from '@shared/infrastructure/dtos';
import { Uuid } from '@shared/domain/value-objects';
import {
  SyncOkrTaskObjectiveUsecase,
  RemoveOkrTaskUsecase,
  PropagateObjectiveToTasksUsecase,
  RemoveKeyResultUsecase,
} from '@okr/application/usecases';

@Injectable()
export class OkrTaskEvent {
  private readonly logger = new Logger(OkrTaskEvent.name);

  private readonly taskDatasource: string;

  private readonly keyResultDatasource: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly syncOkrTaskUsecase: SyncOkrTaskObjectiveUsecase,
    private readonly removeOkrTaskUsecase: RemoveOkrTaskUsecase,
    private readonly propagateObjectiveUsecase: PropagateObjectiveToTasksUsecase,
    private readonly removeKeyResultUsecase: RemoveKeyResultUsecase,
  ) {
    this.taskDatasource = this.configService.get('NOTION_OKR_TASK_DATASOURCE');
    this.keyResultDatasource = this.configService.get(
      'NOTION_KEY_RESULT_DATASOURCE',
    );
  }

  @OnEvent('notion.event')
  async onNotionEvent(event: NotionEventInput): Promise<void> {
    const datasourceId = event.data?.parent?.data_source_id;

    if (datasourceId === this.taskDatasource) {
      await this.handleTaskEvent(event);
      return;
    }

    if (datasourceId === this.keyResultDatasource) {
      await this.handleKeyResultEvent(event);
    }
  }

  private async handleTaskEvent(event: NotionEventInput): Promise<void> {
    const taskId = Uuid.create(event.entity.id);

    const eventHandlers: Record<NotionEventType, () => Promise<void>> = {
      [NotionEventType.PAGE_CREATED]: () =>
        this.syncOkrTaskUsecase.execute(taskId),

      [NotionEventType.PAGE_PROPERTIES_UPDATED]: () =>
        this.syncOkrTaskUsecase.execute(taskId),

      [NotionEventType.PAGE_UNDELETED]: () =>
        this.syncOkrTaskUsecase.execute(taskId),

      [NotionEventType.PAGE_DELETED]: () =>
        this.removeOkrTaskUsecase.execute(taskId),
    };

    const handler = eventHandlers[event.type];

    if (!handler) {
      this.logger.warn(`No handler for task event type: ${event.type}`);
      return;
    }

    try {
      await handler();
    } catch (error) {
      this.logger.error(`Failed to handle task event: ${event.type}`, {
        taskId: taskId.value,
        message: error.message,
      });
    }
  }

  private async handleKeyResultEvent(event: NotionEventInput): Promise<void> {
    const keyResultId = Uuid.create(event.entity.id);

    const eventHandlers: Record<NotionEventType, () => Promise<void>> = {
      [NotionEventType.PAGE_CREATED]: async () => {
        // No action needed for new KeyResult creation
      },

      [NotionEventType.PAGE_PROPERTIES_UPDATED]: () =>
        this.propagateObjectiveUsecase.execute(keyResultId),

      [NotionEventType.PAGE_UNDELETED]: () =>
        this.propagateObjectiveUsecase.execute(keyResultId),

      [NotionEventType.PAGE_DELETED]: () =>
        this.removeKeyResultUsecase.execute(keyResultId),
    };

    const handler = eventHandlers[event.type];

    if (!handler) {
      this.logger.warn(`No handler for KeyResult event type: ${event.type}`);
      return;
    }

    try {
      await handler();
    } catch (error) {
      this.logger.error(`Failed to handle KeyResult event: ${event.type}`, {
        keyResultId: keyResultId.value,
        message: error.message,
      });
    }
  }
}
