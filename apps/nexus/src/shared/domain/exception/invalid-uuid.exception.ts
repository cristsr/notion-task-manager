import { DomainException } from './domain.exception';

export class InvalidUuidError extends DomainException {
  readonly code = 'INVALID_UUID';

  constructor(context: { value: string }) {
    super(`"${context.value}" is not a valid UUID`, { context });
  }
}
