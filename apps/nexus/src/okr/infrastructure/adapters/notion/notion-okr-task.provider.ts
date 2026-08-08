import { Injectable, Logger } from '@nestjs/common';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { catchError, defer, EMPTY, expand, from, lastValueFrom, map, of, reduce, retry, takeWhile } from 'rxjs';
import { NotionClient } from '@shared/infrastructure/config/notion';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { OkrTask, OkrTaskDataSourcePort } from '@okr/domain';
import { NotionOkrTaskMapper } from './notion-okr-task.mapper';
import { ConfigService } from '@nestjs/config';
import { OkrTaskSyncException } from '@okr/application/exceptions';
import { ErrorLogFormatter } from '@shared/application/logging';

@Injectable()
export class NotionOkrTaskProvider implements OkrTaskDataSourcePort {
  private readonly logger = new Logger(NotionOkrTaskProvider.name);

  private readonly okrTaskDatabaseId: string;
  private readonly keyResultProperty: string;
  private readonly objectiveProperty: string;
  private readonly statusProperty: string;
  private readonly progressProperty: string;

  constructor(
    private readonly notionClient: NotionClient,
    private readonly configService: ConfigService,
  ) {
    this.okrTaskDatabaseId = this.configService.get('NOTION_OKR_TASK_DATABASE_ID');
    this.keyResultProperty = this.configService.get('NOTION_OKR_KEY_RESULT_PROPERTY');
    this.objectiveProperty = this.configService.get('NOTION_ORK_OBJECTIVE_PROPERTY');
    this.statusProperty = this.configService.get('NOTION_OKR_STATUS_PROPERTY');
    this.progressProperty = this.configService.get('NOTION_OKR_PROGRESS_PROPERTY');
  }

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
            progressProperty: this.progressProperty,
            statusProperty: this.statusProperty,
          },
        ),
      ),
      catchError((err) => {
        this.logger.warn(
          ErrorLogFormatter.format({
            code: 'FIND_OKR_TASK_FAILED',
            message: `Failed to fetch OKR Task by Id from Notion.`,
            context: { taskId: id.value },
            cause: err,
          }),
        );
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
        throw new OkrTaskSyncException(
          {
            taskId: taskId.value,
            objectiveId: objectiveId?.value,
          },
          err,
        );
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
          throw new OkrTaskSyncException(
            {
              taskId: taskId.value,
              keyResultId: keyResultId?.value,
            },
            err,
          );
        }),
      ),
    );

    await lastValueFrom(source);
  }

  async updateProgress(taskId: Uuid, progress: number): Promise<void> {
    const source = defer(() =>
      from(
        this.notionClient.pages.update({
          page_id: taskId.value,
          properties: {
            [this.progressProperty]: {
              number: progress,
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
        throw new OkrTaskSyncException(
          {
            taskId: taskId.value,
            progress,
          },
          err,
        );
      }),
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
        catchError((err) => {
          this.logger.warn(
            ErrorLogFormatter.format({
              code: 'FIND_OKR_TASKS_BY_KEY_RESULT_ID_FAILED',
              message: 'Failed to query OKR Tasks from Notion',
              context: { keyResultId: keyResultId.value },
              cause: err,
            }),
          );
          return of({ cursor: null, hasMore: false, results: [] });
        }),
      );
    };

    const source = defer(() => query()).pipe(
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
              progressProperty: this.progressProperty,
              statusProperty: this.statusProperty,
            },
          ),
        ),
      ),
    );

    return await lastValueFrom(source);
  }

  async getPendingTasks(): Promise<OkrTask[]> {
    const query = (cursor?: string) => {
      return from(
        this.notionClient.databases.query({
          database_id: this.okrTaskDatabaseId,
          start_cursor: cursor,
          filter: {
            property: this.statusProperty,
            status: {
              does_not_equal: 'Done',
            },
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
        catchError((err) => {
          this.logger.warn(
            ErrorLogFormatter.format({
              code: 'FIND_PENDING_OKR_TASKS_FAILED',
              message: 'Failed to query pending OKR Tasks from Notion',
              cause: err,
            }),
          );
          return of({ cursor: null, hasMore: false, results: [] });
        }),
      );
    };

    const source = defer(() => query()).pipe(
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
              progressProperty: this.progressProperty,
              statusProperty: this.statusProperty,
            },
          ),
        ),
      ),
    );

    return await lastValueFrom(source);
  }
}
