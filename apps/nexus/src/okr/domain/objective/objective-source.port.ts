import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { Objective } from './objective.entity';

export abstract class ObjectiveSourcePort {
  abstract fetchById(id: Uuid): Promise<Nullable<Objective>>;
}
