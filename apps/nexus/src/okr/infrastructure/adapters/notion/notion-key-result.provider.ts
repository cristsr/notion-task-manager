import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import {
  catchError,
  defer,
  EMPTY,
  expand,
  from,
  lastValueFrom,
  map,
  of,
  reduce,
  retry,
  zip,
  takeWhile,
  switchMap,
  toArray,
  concatMap,
} from 'rxjs';
import {
  KeyResultProviderPort,
  OkrTaskProviderPort,
} from '@okr/application/ports';
import { NotionClient } from '@shared/infrastructure/config/notion';
import { KeyResult } from '@okr/domain';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { NotionKeyResultMapper } from './notion-key-result.mapper';

@Injectable()
export class NotionKeyResultProvider implements KeyResultProviderPort {
  private readonly logger = new Logger(NotionKeyResultProvider.name);
  private readonly objectiveProperty: string = '🚀 Objective';
  private readonly databaseId: string;

  constructor(
    private readonly config: ConfigService,
    private readonly notionClient: NotionClient,
    private readonly taskProvider: OkrTaskProviderPort,
  ) {
    this.databaseId = this.config.get('NOTION_KEY_RESULT_DATABASE_ID');
  }

  async fetchById(id: Uuid): Promise<Nullable<KeyResult>> {
    // Prepare observables for fetching Key Result and its related tasks
    const keyResult$ = defer(() =>
      from(this.notionClient.pages.retrieve({ page_id: id.value })),
    ).pipe(
      retry({
        count: 2,
        delay: 1000,
        resetOnSuccess: true,
      }),
      catchError((err) => {
        this.logger.warn('Failed to fetch Key Result from Notion', {
          keyResultId: id.value,
          message: err.message,
        });
        return EMPTY;
      }),
    );

    const keyResultTaskIds$ = defer(() =>
      this.taskProvider.getTaskIdsByKeyResultId(id),
    );

    // Combine both observables into one and map the result to a KeyResult domain object
    const result$ = zip(keyResult$, keyResultTaskIds$).pipe(
      map(([keyResult, taskIds]) => {
        return NotionKeyResultMapper.toDomain(
          {
            keyResult: keyResult as PageObjectResponse,
            taskIds,
          },
          {
            objectiveProperty: this.objectiveProperty,
          },
        );
      }),
    );

    return await lastValueFrom(result$, { defaultValue: null });
  }

  async fetchAll(): Promise<KeyResult[]> {
    const source = defer(() => this.queryKeyResults()).pipe(
      expand((state) => {
        if (!state.hasMore) return EMPTY;
        return this.queryKeyResults(state.cursor);
      }),
      takeWhile((state) => state.hasMore, true),
      map((state) => state.results),
      reduce(
        (acc, results) => [...acc, ...results],
        [] as PageObjectResponse[],
      ),
      switchMap((results) => {
        return from(results).pipe(
          concatMap(async (result) => {
            const taskIds = await this.taskProvider.getTaskIdsByKeyResultId(
              Uuid.create(result.id),
            );

            return NotionKeyResultMapper.toDomain(
              {
                keyResult: result,
                taskIds,
              },
              {
                objectiveProperty: this.objectiveProperty,
              },
            );
          }),
          toArray(),
        );
      }),
    );

    return await lastValueFrom(source, { defaultValue: [] });
  }

  private queryKeyResults(cursor?: string) {
    return from(
      this.notionClient.databases.query({
        database_id: this.databaseId,
        start_cursor: cursor,
      }),
    ).pipe(
      retry({
        count: 3,
        delay: 1000,
        resetOnSuccess: true,
      }),
      map((response) => ({
        cursor: response.next_cursor,
        hasMore: response.has_more,
        results: response.results as PageObjectResponse[],
      })),
      catchError((err) => {
        this.logger.warn('Failed to query Key Results from Notion', {
          cursor,
          message: err.message,
        });
        return of({ cursor: null, hasMore: false, results: [] });
      }),
    );
  }
}
