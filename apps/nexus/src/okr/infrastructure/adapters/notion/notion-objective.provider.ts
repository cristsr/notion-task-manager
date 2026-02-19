import { Injectable, Logger } from '@nestjs/common';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import {
  catchError,
  defer,
  EMPTY,
  from,
  lastValueFrom,
  map,
  retry,
} from 'rxjs';
import { ObjectiveProviderPort } from '@okr/application/ports';
import { NotionClient } from '@shared/infrastructure/config/notion';
import { Objective } from '@okr/domain';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { NotionObjectiveMapper } from './notion-objective.mapper';

@Injectable()
export class NotionObjectiveProvider implements ObjectiveProviderPort {
  private readonly logger = new Logger(NotionObjectiveProvider.name);

  constructor(private readonly notionClient: NotionClient) {}

  async fetchById(id: Uuid): Promise<Nullable<Objective>> {
    const source = defer(() =>
      from(this.notionClient.pages.retrieve({ page_id: id.value })),
    ).pipe(
      retry({
        count: 3,
        delay: 1000,
        resetOnSuccess: true,
      }),
      map((response: PageObjectResponse) =>
        NotionObjectiveMapper.toDomain(response),
      ),
      catchError((err) => {
        this.logger.warn('Failed to fetch Objective from Notion', {
          objectiveId: id.value,
          message: err.message,
        });
        return EMPTY;
      }),
    );

    return await lastValueFrom(source, { defaultValue: null });
  }
}
