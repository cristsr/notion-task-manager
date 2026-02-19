import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { KeyResult } from '@okr/domain';

export class NotionKeyResultMapper {
  static toDomain(
    config: {
      keyResult: PageObjectResponse;
      taskIds: Uuid[];
    },
    options: {
      objectiveProperty: string;
    },
  ): KeyResult {
    return KeyResult.create({
      id: Uuid.create(config.keyResult.id),
      objectiveId: Uuid.create(
        NotionKeyResultMapper.extractObjectiveId(config.keyResult, {
          objectiveProperty: options.objectiveProperty,
        }),
      ),
      updatedAt: DateTime.fromISO(config.keyResult.last_edited_time),
      taskIds: config.taskIds,
      title: NotionKeyResultMapper.extractTitle(config.keyResult),
    });
  }

  private static extractTitle(input: PageObjectResponse): string {
    return input.properties['Name']['title'][0]['plain_text'] ?? '';
  }

  private static extractObjectiveId(
    input: PageObjectResponse,
    options: {
      objectiveProperty: string;
    },
  ): string {
    return input.properties[options.objectiveProperty]?.['relation']?.[0]?.id;
  }
}
