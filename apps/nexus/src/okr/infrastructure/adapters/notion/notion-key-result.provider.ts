import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { catchError, defer, EMPTY, expand, from, lastValueFrom, map, of, reduce, retry, takeWhile } from 'rxjs';
import { KeyResult, KeyResultDataSourcePort } from '@okr/domain';
import { NotionClient } from '@shared/infrastructure/config/notion';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { NotionKeyResultMapper } from './notion-key-result.mapper';
import { ErrorLogFormatter } from '@shared/infrastructure/logging';

@Injectable()
export class NotionKeyResultProvider implements KeyResultDataSourcePort {
  private readonly logger = new Logger(NotionKeyResultProvider.name);

  private readonly objectiveProperty: string = this.config.get('NOTION_ORK_OBJECTIVE_PROPERTY');
  private readonly databaseId: string = this.config.get('NOTION_ORK_KEY_RESULT_DATABASE_ID');

  constructor(
    private readonly config: ConfigService,
    private readonly notionClient: NotionClient,
  ) {}

  async fetchById(id: Uuid): Promise<Nullable<KeyResult>> {
    const source = defer(() =>
      from(
        this.notionClient.pages.retrieve({
          page_id: id.value,
        }),
      ),
    ).pipe(
      retry({
        count: 3,
        delay: 1000,
        resetOnSuccess: true,
      }),
      catchError((err) => {
        this.logger.warn(
          ErrorLogFormatter.format({
            code: 'FIND_OKR_KEY_RESULT_FAILED',
            message: 'Failed to fetch Key Result by Id from Notion',
            context: { keyResultId: id.value },
            cause: err,
          }),
        );
        return EMPTY;
      }),
      map((keyResult: PageObjectResponse) => {
        return NotionKeyResultMapper.toDomain(
          {
            keyResult,
          },
          {
            objectiveProperty: this.objectiveProperty,
          },
        );
      }),
    );

    return await lastValueFrom(source, { defaultValue: null });
  }

  async fetchAll(): Promise<KeyResult[]> {
    const queryKeyResults = (cursor?: string) =>
      from(
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
          this.logger.warn(
            ErrorLogFormatter.format({
              code: 'FIND_OKR_KEY_RESULTS_FAILED',
              message: 'Failed to query Key Results from Notion',
              context: { cursor },
              cause: err,
            }),
          );
          return of({ cursor: null, hasMore: false, results: [] });
        }),
      );

    const source = defer(() => queryKeyResults()).pipe(
      expand((state) => {
        if (!state.hasMore) return EMPTY;
        return queryKeyResults(state.cursor);
      }),
      takeWhile((state) => state.hasMore, true),
      map((state) => state.results),
      reduce((acc, results) => [...acc, ...results], [] as PageObjectResponse[]),
      map((results) =>
        results.map((r) =>
          NotionKeyResultMapper.toDomain(
            { keyResult: r },
            {
              objectiveProperty: this.objectiveProperty,
            },
          ),
        ),
      ),
    );

    return await lastValueFrom(source, { defaultValue: [] });
  }
}
