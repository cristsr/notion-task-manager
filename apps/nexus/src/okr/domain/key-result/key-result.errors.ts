import { DomainError } from '@shared/domain/errors';

export class KeyResultNotFoundInSourceError extends DomainError {
  readonly code = 'KEY_RESULT_NOT_FOUND_IN_SOURCE';

  constructor(keyResultId: string) {
    super(`KeyResult with id ${keyResultId} not found in source`);
  }
}
