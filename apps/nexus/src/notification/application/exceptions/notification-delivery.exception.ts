import { ExternalServiceException } from '@shared/application/exceptions';

export class NotificationDeliveryException extends ExternalServiceException {
  readonly code = 'NOTIFICATION_DELIVERY_FAILED';

  constructor(
    context: {
      provider: string;
      title: string;
      reason: string;
    },
    cause?: Error,
  ) {
    super(`Failed to deliver notification: ${context.reason}`, { context, cause });
  }
}
