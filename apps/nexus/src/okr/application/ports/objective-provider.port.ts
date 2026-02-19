import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { Objective } from '@okr/domain';

export abstract class ObjectiveProviderPort {
  abstract fetchById(id: Uuid): Promise<Nullable<Objective>>;
}
