import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { KeyResult } from '@okr/domain';
import { MongodbKeyResultEntity } from './mongodb-key-result.entity';

export class MongodbKeyResultMapper {
  static toEntity(keyResult: KeyResult): MongodbKeyResultEntity {
    return new MongodbKeyResultEntity({
      id: keyResult.id.value,
      objectiveId: keyResult.objectiveId?.value ?? null,
      updatedAt: keyResult.updatedAt.toJSDate(),
      title: keyResult.title,
    });
  }

  static toDomain(entity: MongodbKeyResultEntity): KeyResult {
    return KeyResult.create({
      id: Uuid.create(entity.id),
      objectiveId: entity.objectiveId ? Uuid.create(entity.objectiveId) : null,
      updatedAt: DateTime.fromJSDate(entity.updatedAt),
      title: entity.title,
    });
  }
}
