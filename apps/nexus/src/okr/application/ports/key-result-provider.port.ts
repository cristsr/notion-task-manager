import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { KeyResult } from '@okr/domain';

export abstract class KeyResultProviderPort {
  abstract fetchById(id: Uuid): Promise<Nullable<KeyResult>>;
  abstract fetchAll(): Promise<KeyResult[]>;
}
