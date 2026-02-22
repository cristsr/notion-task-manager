import { DomainError } from '@shared/domain/errors';

export class OkrTaskNotFoundError extends DomainError {
  readonly code = 'OKR_TASK_NOT_FOUND';

  constructor(taskId: string) {
    super(`OkrTask with id ${taskId} not found in source`);
  }
}

export class KeyResultNotFoundError extends DomainError {
  readonly code = 'KEY_RESULT_NOT_FOUND';

  constructor(keyResultId: string) {
    super(`KeyResult with id ${keyResultId} not found`);
  }
}

export class ObjectiveNotFoundError extends DomainError {
  readonly code = 'OBJECTIVE_NOT_FOUND';

  constructor(objectiveId: string) {
    super(`Objective with id ${objectiveId} not found`);
  }
}

export class TaskCleanupFailedError extends DomainError {
  readonly code = 'TASK_CLEANUP_FAILED';

  constructor(
    readonly failedTaskIds: string[],
    readonly cleanedCount: number,
  ) {
    super(`Failed to cleanup ${failedTaskIds.length} tasks. Successfully cleaned: ${cleanedCount}`);
  }
}

export type OkrTaskError =
  | OkrTaskNotFoundError
  | KeyResultNotFoundError
  | ObjectiveNotFoundError
  | TaskCleanupFailedError;
