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
  reduce,
  retry,
  takeWhile,
} from 'rxjs';
import { DailyTaskProviderPort } from '@daily/application/ports';
import { NotionClient } from '@shared/infrastructure/config/notion';
import { DailyTask } from '@daily/domain';
import { Uuid } from '@shared/domain/value-objects';
import { NotionDailyTaskMapper } from './notion-daily-task.mapper';

@Injectable()
export class NotionDailyTaskProvider implements DailyTaskProviderPort {
  private readonly logger = new Logger(NotionDailyTaskProvider.name);
  constructor(
    private readonly notionClient: NotionClient,
    private readonly config: ConfigService,
  ) {}

  async fetchAll(): Promise<DailyTask[]> {
    const source = defer(() => this.queryTasks()).pipe(
      expand((state) => {
        if (!state.hasMore) return EMPTY;
        return this.queryTasks(state.cursor);
      }),
      takeWhile((state) => state.hasMore, true),
      map((state) => state.results),
      reduce((acc, results) => [...acc, ...results], []),
      map((results) => results.map(NotionDailyTaskMapper.toDomain)),
    );

    return await lastValueFrom(source);
  }

  async fetchById(id: Uuid): Promise<DailyTask | null> {
    const response = await this.notionClient.pages.retrieve({
      page_id: id.value,
    });
    return NotionDailyTaskMapper.toDomain(response as PageObjectResponse);
  }

  async update(task: DailyTask): Promise<void> {
    await this.notionClient.pages.update({
      page_id: task.id.value,
      properties: {
        '👁 Hidden': {
          checkbox: task.hidden,
        },
      },
    });
  }

  private queryTasks(cursor?: string) {
    return from(
      this.notionClient.databases.query({
        database_id: this.config.get('NOTION_TASK_DATABASE_ID'),
        filter: {
          and: [
            {
              property: '📊 Status',
              status: {
                equals: 'Not started',
              },
            },
            {
              property: '📅 Date',
              date: {
                is_not_empty: true,
              },
            },
          ],
        },
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
  }
}
