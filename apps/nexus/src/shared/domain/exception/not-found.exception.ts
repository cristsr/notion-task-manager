import { DomainException } from './domain.exception';

export class NotFoundException extends DomainException {
  readonly code: string = 'NOT_FOUND';
}
