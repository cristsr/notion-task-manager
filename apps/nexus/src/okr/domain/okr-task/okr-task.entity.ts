import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable, PropertiesOnly } from '@shared/domain/types';

export class OkrTask {
  id: Uuid;

  keyResultId: Nullable<Uuid>;

  objectiveId: Nullable<Uuid>;

  updatedAt: DateTime;

  private constructor(input: PropertiesOnly<OkrTask>) {
    Object.assign(this, input);
  }

  static create(input: PropertiesOnly<OkrTask>): OkrTask {
    return new OkrTask(input);
  }

  markAsUpdated(): void {
    this.updatedAt = DateTime.local();
  }
}
