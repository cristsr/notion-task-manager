import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PageObjectResponse,
  PropertyItemPropertyItemListResponse,
  RelationPropertyItemObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import {
  catchError,
  defer,
  EMPTY,
  expand,
  filter,
  from,
  lastValueFrom,
  map,
  reduce,
  retry,
  takeWhile,
} from 'rxjs';
import { OkrTaskProviderPort } from '@okr/application/ports';
import { NotionClient } from '@shared/infrastructure/config/notion';
import { OkrTask } from '@okr/domain';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { NotionOkrTaskMapper } from './notion-okr-task.mapper';

@Injectable()
export class NotionOkrTaskProvider implements OkrTaskProviderPort {
  private readonly logger = new Logger(NotionOkrTaskProvider.name);
  private readonly keyResultProperty: string = '🎯 Key Result';
  private readonly objectiveProperty: string = '🚀 Objective';

  constructor(
    private readonly notionClient: NotionClient,
    private readonly config: ConfigService,
  ) {}

  async fetchById(id: Uuid): Promise<Nullable<OkrTask>> {
    const source = defer(() =>
      from(this.notionClient.pages.retrieve({ page_id: id.value })),
    ).pipe(
      retry({
        count: 3,
        delay: 1000,
        resetOnSuccess: true,
      }),
      map((response) =>
        NotionOkrTaskMapper.toDomain(
          response as PageObjectResponse,
          this.keyResultProperty,
          this.objectiveProperty,
        ),
      ),
      catchError((err) => {
        this.logger.warn('Failed to fetch OKR task from Notion', {
          taskId: id.value,
          message: err.message,
        });
        return EMPTY;
      }),
    );

    return await lastValueFrom(source, { defaultValue: null });
  }

  async updateObjective(
    taskId: Uuid,
    objectiveId: Nullable<Uuid>,
  ): Promise<void> {
    const source = defer(() =>
      from(
        this.notionClient.pages.update({
          page_id: taskId.value,
          properties: {
            [this.objectiveProperty]: {
              relation: objectiveId ? [{ id: objectiveId.value }] : [],
            },
          },
        }),
      ),
    ).pipe(
      retry({
        count: 3,
        delay: 1000,
        resetOnSuccess: true,
      }),
      catchError((err) => {
        this.logger.error('Failed to update OKR task objective in Notion', {
          taskId: taskId.value,
          objectiveId: objectiveId?.value,
          message: err.message,
        });
        throw err;
      }),
    );

    await lastValueFrom(source);
  }

  async getTaskIdsByKeyResultId(keyResultId: Uuid): Promise<Uuid[]> {
    const query = (cursor?: string) => {
      return from(
        this.notionClient.pages.properties.retrieve({
          page_id: keyResultId.value,
          property_id: 'cOmj', // TODO: UPDATE VALUE IN CONFIG
          start_cursor: cursor,
          page_size: 100,
        }),
      ).pipe(
        retry({
          count: 3,
          delay: 1000,
          resetOnSuccess: true,
        }),
        filter((res) => res.object === 'list'),
        map((response: PropertyItemPropertyItemListResponse) => ({
          cursor: response.next_cursor,
          hasMore: response.has_more,
          results: response.results,
        })),
        catchError((err) => {
          this.logger.warn('Failed to retrieve tasks from notion', {
            cursor,
            message: err.message,
          });

          return EMPTY;
        }),
      );
    };

    const source = defer(() => query()).pipe(
      // Recursively until hasMore is false
      expand((state) => {
        if (!state.hasMore) return EMPTY;
        return query(state.cursor);
      }),
      takeWhile((state) => state.hasMore, true),
      map((state) => state.results),
      reduce((acc, results) => [...acc, ...results], []),
      map((results: RelationPropertyItemObjectResponse[]) => {
        return results.map((r) => r.relation.id);
      }),
      map((results: string[]) => results.map(Uuid.create)),
    );

    return await lastValueFrom(source);
  }
}
