import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { KeyResult } from './key-result.entity';

export abstract class KeyResultSourcePort {
  abstract fetchById(id: Uuid): Promise<Nullable<KeyResult>>;
  abstract fetchAll(): Promise<KeyResult[]>;
}
