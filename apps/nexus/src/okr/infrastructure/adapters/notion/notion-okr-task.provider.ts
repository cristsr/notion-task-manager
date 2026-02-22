import { Injectable, Logger } from '@nestjs/common';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { catchError, defer, EMPTY, expand, from, lastValueFrom, map, reduce, retry, takeWhile } from 'rxjs';
import { NotionClient } from '@shared/infrastructure/config/notion';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { OkrTask, OkrTaskDataSourcePort } from '@okr/domain';
import { NotionOkrTaskMapper } from './notion-okr-task.mapper';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotionOkrTaskProvider implements OkrTaskDataSourcePort {
  private readonly logger = new Logger(NotionOkrTaskProvider.name);

  private readonly okrTaskDatabaseId: string = this.configService.get('NOTION_OKR_TASK_DATABASE_ID');
  private readonly keyResultProperty: string = this.configService.get('NOTION_OKR_KEY_RESULT_PROPERTY');
  private readonly objectiveProperty: string = this.configService.get('NOTION_ORK_OBJECTIVE_PROPERTY');
  private readonly statusProperty: string = this.configService.get('NOTION_OKR_STATUS_PROPERTY');

  constructor(
    private readonly notionClient: NotionClient,
    private readonly configService: ConfigService,
  ) {}

  async fetchById(id: Uuid): Promise<Nullable<OkrTask>> {
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
      map((okrTask: PageObjectResponse) =>
        NotionOkrTaskMapper.toDomain(
          {
            okrTask,
          },
          {
            keyResultProperty: this.keyResultProperty,
            objectiveProperty: this.objectiveProperty,
          },
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

  async updateObjective(taskId: Uuid, objectiveId: Nullable<Uuid>): Promise<void> {
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

  async updateKeyResult(taskId: Uuid, keyResultId: Nullable<Uuid>): Promise<void> {
    const source = defer(() =>
      from(
        this.notionClient.pages.update({
          page_id: taskId.value,
          properties: {
            [this.keyResultProperty]: {
              relation: keyResultId ? [{ id: keyResultId.value }] : [],
            },
          },
        }),
      ).pipe(
        retry({
          count: 3,
          delay: 1000,
          resetOnSuccess: true,
        }),
        catchError((err) => {
          this.logger.error('Failed to update OKR task key result in Notion', {
            taskId: taskId.value,
            keyResultId: keyResultId?.value,
            message: err.message,
          });

          throw err;
        }),
      ),
    );

    await lastValueFrom(source);
  }

  async getTasksByKeyResultId(keyResultId: Uuid): Promise<OkrTask[]> {
    const query = (cursor?: string) => {
      return from(
        this.notionClient.databases.query({
          database_id: this.okrTaskDatabaseId,
          start_cursor: cursor,
          filter: {
            and: [
              {
                property: this.keyResultProperty,
                relation: {
                  contains: keyResultId.value,
                },
              },
              {
                property: this.statusProperty,
                status: {
                  does_not_equal: 'Done',
                },
              },
            ],
          },
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
      map((results) =>
        results.map((okrTask) =>
          NotionOkrTaskMapper.toDomain(
            {
              okrTask,
            },
            {
              keyResultProperty: this.keyResultProperty,
              objectiveProperty: this.objectiveProperty,
            },
          ),
        ),
      ),
    );

    return await lastValueFrom(source);
  }
}
