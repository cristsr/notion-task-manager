import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { KeyResult } from './key-result.entity';

export abstract class KeyResultRepository {
  abstract findById(id: Uuid): Promise<Nullable<KeyResult>>;
  abstract findAll(): Promise<KeyResult[]>;
  abstract save(keyResult: KeyResult): Promise<void>;
  abstract saveMany(keyResults: KeyResult[]): Promise<void>;
  abstract remove(id: Uuid): Promise<void>;
}
