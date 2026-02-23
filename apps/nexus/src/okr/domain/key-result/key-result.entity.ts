import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable, PropertiesOnly } from '@shared/domain/types';

export class KeyResult {
  id: Uuid;

  title: string;

  objectiveId: Nullable<Uuid>;

  updatedAt: DateTime;

  private constructor(input: PropertiesOnly<KeyResult>) {
    Object.assign(this, input);
  }

  static create(input: PropertiesOnly<KeyResult>): KeyResult {
    return new KeyResult(input);
  }
}
