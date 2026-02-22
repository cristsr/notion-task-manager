import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable, PropertiesOnly } from '@shared/domain/types';
import { match, P } from 'ts-pattern';

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

  /**
   * Checks if the objective has changed.
   * @param otherObjectiveId
   */
  hasObjectiveChanged(otherObjectiveId: Nullable<Uuid>): boolean {
    return (
      match({ current: this.objectiveId, next: otherObjectiveId })
        // Current and new are null, so there is no change, means that are equal
        .with({ current: P.nullish, next: P.nullish }, () => false)

        // Changes from null to something or vice versa, there is a change
        .with({ current: P.nullish, next: P.nonNullable }, () => true)
        .with({ current: P.nonNullable, next: P.nullish }, () => true)

        // Both are not null, so check if they are different
        .otherwise(() => !this.objectiveId.equals(otherObjectiveId))
    );
  }

  markAsUpdated(): void {
    this.updatedAt = DateTime.local();
  }
}
