import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { OkrTask } from '@okr/domain';

export abstract class OkrTaskProviderPort {
  abstract fetchById(id: Uuid): Promise<Nullable<OkrTask>>;
  abstract updateObjective(
    taskId: Uuid,
    objectiveId: Nullable<Uuid>,
  ): Promise<void>;
  abstract getTaskIdsByKeyResultId(keyResultId: Uuid): Promise<Uuid[]>;
}
