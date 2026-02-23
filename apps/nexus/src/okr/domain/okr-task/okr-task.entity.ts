import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable, PropertiesOnly } from '@shared/domain/types';
import { OkrTaskStatus } from '@okr/domain/okr-task';

export class OkrTask {
  id: Uuid;

  keyResultId: Nullable<Uuid>;

  objectiveId: Nullable<Uuid>;

  updatedAt: DateTime;

  status: OkrTaskStatus;

  progress: number;

  private constructor(input: PropertiesOnly<OkrTask>) {
    Object.assign(this, input);
  }

  static create(input: PropertiesOnly<OkrTask>): OkrTask {
    return new OkrTask(input);
  }

  markAsUpdated(): void {
    this.updatedAt = DateTime.local();
  }

  isDone(): boolean {
    return this.status === OkrTaskStatus.DONE;
  }

  hasProgress(): boolean {
    return this.progress > 0;
  }

  setProgress(number: number) {
    this.progress = number;
  }
}
