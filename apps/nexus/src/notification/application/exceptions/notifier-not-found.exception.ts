import { NotFoundException } from '@shared/domain/exception';

export class NotifierNotFoundError extends NotFoundException {
  readonly code = 'NOTIFIER_NOT_FOUND';

  constructor(context: { provider: string }) {
    super(`Notifier provider not found: ${context.provider}`, { context });
  }
}
