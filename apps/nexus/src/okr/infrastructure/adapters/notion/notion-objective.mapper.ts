import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { Uuid } from '@shared/domain/value-objects';
import { Objective } from '@okr/domain';

export class NotionObjectiveMapper {
  static toDomain(input: PageObjectResponse): Objective {
    return Objective.create({
      id: Uuid.create(input.id),
      title: input.properties['Name']['title'][0]['plain_text'] ?? '',
    });
  }
}
