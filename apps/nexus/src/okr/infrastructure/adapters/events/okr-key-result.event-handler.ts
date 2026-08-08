import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { NotionEventInput, NotionEventType } from '@shared/infrastructure/dtos';
import { Uuid } from '@shared/domain/value-objects';
import { SyncOkrKeyResultUsecase } from '@okr/application/usecases';
import { match } from 'ts-pattern';
import { ErrorLogFormatter } from '@shared/application/logging';

@Injectable()
export class OkrKeyResultEventHandler {
  private readonly logger = new Logger(OkrKeyResultEventHandler.name);

  private readonly keyResultDatasource: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly propagateObjectiveUsecase: SyncOkrKeyResultUsecase,
  ) {
    this.keyResultDatasource = this.configService.get('NOTION_OKR_KEY_RESULT_DATASOURCE');
  }

  @OnEvent('notion.event')
  async onNotionEvent(event: NotionEventInput): Promise<void> {
    const datasourceId = event.data?.parent?.data_source_id;

    if (datasourceId === this.keyResultDatasource) {
      const keyResultId = Uuid.create(event.entity.id);

      try {
        await match(event.type)
          .with(NotionEventType.PAGE_CREATED, () => undefined)
          .with(NotionEventType.PAGE_PROPERTIES_UPDATED, () => this.propagateObjectiveUsecase.execute(keyResultId))
          .with(NotionEventType.PAGE_UNDELETED, () => this.propagateObjectiveUsecase.execute(keyResultId))
          .with(NotionEventType.PAGE_DELETED, () => this.propagateObjectiveUsecase.execute(keyResultId))
          .exhaustive();
      } catch (error) {
        this.logger.error(ErrorLogFormatter.format(error));
      }
    }
  }
}
