import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { KeyResult } from '@okr/domain';

export class NotionKeyResultMapper {
  static toDomain(
    config: {
      keyResult: PageObjectResponse;
    },
    options: {
      objectiveProperty: string;
    },
  ): KeyResult {
    return KeyResult.create({
      id: Uuid.create(config.keyResult.id),
      title: config.keyResult.properties['Name']['title'][0]['plain_text'] ?? '',
      objectiveId: Uuid.createOrNull(
        config.keyResult.properties[options.objectiveProperty]?.['relation']?.[0]?.id ?? null,
      ),
      updatedAt: DateTime.fromISO(config.keyResult.last_edited_time),
    });
  }
}
