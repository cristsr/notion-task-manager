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

  setObjective(objectiveId: Nullable<Uuid>): void {
    this.objectiveId = objectiveId;
    this.updatedAt = DateTime.local();
  }

  setKeyResult(keyResultId: Nullable<Uuid>): void {
    this.keyResultId = keyResultId;
    this.updatedAt = DateTime.local();
  }

  unlinkFromKeyResult(): void {
    this.keyResultId = null;
    this.objectiveId = null;
    this.updatedAt = DateTime.local();
  }

  markAsUpdated(): void {
    this.updatedAt = DateTime.local();
  }
}
