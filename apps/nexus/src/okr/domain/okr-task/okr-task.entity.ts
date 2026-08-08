import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable, PropertiesOnly } from '@shared/domain/types';
import { match } from 'ts-pattern';
import { OkrTaskStatus } from './okr-task.enum';

export class OkrTask {
  /**
   * Progress assigned when a task starts being worked on
   */
  private static readonly STARTED_PROGRESS = 0.1;

  /**
   * Progress assigned when a task is finished
   */
  private static readonly COMPLETED_PROGRESS = 1;

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

  setProgress(progress: number): void {
    this.progress = progress;
  }

  /**
   * Align progress with the current status.
   * Returns whether the progress actually changed.
   */
  syncProgressWithStatus(): boolean {
    const progress = match([this.status, this.hasProgress()])
      .with([OkrTaskStatus.IN_PROGRESS, false], () => OkrTask.STARTED_PROGRESS)
      .with([OkrTaskStatus.DONE, true], () => OkrTask.COMPLETED_PROGRESS)
      .otherwise(() => this.progress);

    if (progress === this.progress) return false;

    this.setProgress(progress);

    return true;
  }
}
