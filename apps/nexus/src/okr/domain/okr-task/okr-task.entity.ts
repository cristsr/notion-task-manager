import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable, PropertiesOnly } from '@shared/domain/types';
import { match, P } from 'ts-pattern';

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

  hasKeyResultChanged(otherKeyResultId: Nullable<Uuid>): boolean {
    return (
      match({ current: this.objectiveId, next: otherKeyResultId })
        // Current and new are null, so there is no change, means that are equal
        .with({ current: P.nullish, next: P.nullish }, () => false)

        // Changes from null to something or vice versa, there is a change
        .with({ current: P.nullish, next: P.nonNullable }, () => true)
        .with({ current: P.nonNullable, next: P.nullish }, () => true)

        // Both are not null, so check if they are different
        .otherwise(() => !this.objectiveId.equals(otherKeyResultId))
    );
  }

  /**
   * Checks if the objective should be cleared, meaning that the task is not linked to any key result.
   */
  shouldClearObjective(): boolean {
    return !this.keyResultId && !!this.objectiveId;
  }

  updateObjective(objectiveId: Nullable<Uuid>): void {
    this.objectiveId = objectiveId;
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
