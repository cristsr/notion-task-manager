import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { OkrTask } from '@okr/domain';
import { MongodbOkrTaskEntity } from './mongodb-okr-task.entity';

export class MongodbOkrTaskMapper {
  static toEntity(task: OkrTask): MongodbOkrTaskEntity {
    return new MongodbOkrTaskEntity({
      id: task.id.value,
      keyResultId: task.keyResultId?.value ?? null,
      objectiveId: task.objectiveId?.value ?? null,
      updatedAt: task.updatedAt.toJSDate(),
      status: task.status,
      progress: task.progress,
    });
  }

  static toDomain(entity: MongodbOkrTaskEntity): OkrTask {
    return OkrTask.create({
      id: Uuid.create(entity.id),
      keyResultId: entity.keyResultId ? Uuid.create(entity.keyResultId) : null,
      objectiveId: entity.objectiveId ? Uuid.create(entity.objectiveId) : null,
      updatedAt: DateTime.fromJSDate(entity.updatedAt),
      status: entity.status,
      progress: entity.progress,
    });
  }
}
