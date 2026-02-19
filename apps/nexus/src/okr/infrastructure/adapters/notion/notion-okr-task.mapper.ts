import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { OkrTask } from '@okr/domain';

export class NotionOkrTaskMapper {
  static toDomain(
    input: PageObjectResponse,
    keyResultProperty: string,
    objectiveProperty: string,
  ): OkrTask {
    const keyResultRelation = input.properties[keyResultProperty];
    const objectiveRelation = input.properties[objectiveProperty];

    const keyResultId =
      keyResultRelation?.type === 'relation' &&
      keyResultRelation.relation.length > 0
        ? Uuid.create(keyResultRelation.relation[0].id)
        : null;

    const objectiveId =
      objectiveRelation?.type === 'relation' &&
      objectiveRelation.relation.length > 0
        ? Uuid.create(objectiveRelation.relation[0].id)
        : null;

    return OkrTask.create({
      id: Uuid.create(input.id),
      keyResultId,
      objectiveId,
      updatedAt: DateTime.fromISO(input.last_edited_time),
    });
  }
}
