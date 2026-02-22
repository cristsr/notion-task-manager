import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { NotionEventInput, NotionEventType } from '@shared/infrastructure/dtos';
import { Uuid } from '@shared/domain/value-objects';
import { PropagateObjectiveToTasksUsecase } from '@okr/application/usecases';
import { match } from 'ts-pattern';

@Injectable()
export class OkrTaskEvent {
  private readonly logger = new Logger(OkrTaskEvent.name);

  private readonly keyResultDatasource: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly propagateObjectiveUsecase: PropagateObjectiveToTasksUsecase,
  ) {
    this.keyResultDatasource = this.configService.get('NOTION_KEY_RESULT_DATASOURCE');
  }

  @OnEvent('notion.event')
  async onNotionEvent(event: NotionEventInput): Promise<void> {
    const datasourceId = event.data?.parent?.data_source_id;

    if (datasourceId === this.keyResultDatasource) {
      const keyResultId = Uuid.create(event.entity.id);

      try {
        match(event.type)
          .with(NotionEventType.PAGE_CREATED, () => {})
          .with(NotionEventType.PAGE_PROPERTIES_UPDATED, () => this.propagateObjectiveUsecase.execute(keyResultId))
          .with(NotionEventType.PAGE_UNDELETED, () => this.propagateObjectiveUsecase.execute(keyResultId))
          .with(NotionEventType.PAGE_DELETED, () => this.propagateObjectiveUsecase.execute(keyResultId))
          .exhaustive();
      } catch (error) {
        this.logger.error(`Failed to handle KeyResult event: ${event.type}`, {
          keyResultId: keyResultId.value,
          message: error.message,
        });
      }
    }
  }
}
