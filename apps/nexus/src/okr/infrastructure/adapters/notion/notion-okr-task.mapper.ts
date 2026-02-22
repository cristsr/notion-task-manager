import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { OkrTask } from '@okr/domain';

export class NotionOkrTaskMapper {
  static toDomain(
    config: {
      okrTask: PageObjectResponse;
    },
    options: {
      keyResultProperty: string;
      objectiveProperty: string;
    },
  ): OkrTask {
    const keyResultRelation = config.okrTask.properties[options.keyResultProperty];
    const objectiveRelation = config.okrTask.properties[options.objectiveProperty];

    return OkrTask.create({
      id: Uuid.create(config.okrTask.id),
      keyResultId: Uuid.createOrNull(keyResultRelation['relation']?.[0]?.id),
      objectiveId: Uuid.createOrNull(objectiveRelation['relation']?.[0]?.id),
      updatedAt: DateTime.fromISO(config.okrTask.last_edited_time),
    });
  }
}
