import { Inject, Injectable } from '@nestjs/common';
import { NOTIFIERS, NotificationDefaults } from '../ports';
import { NotificationInput } from '../dto';
import { Notifiers } from '../types';
import { NotifierNotFoundError } from '../exceptions';
import { Notification } from '../../domain';

@Injectable()
export class SendNotificationUsecase {
  constructor(
    @Inject(NOTIFIERS)
    private readonly notifiers: Notifiers,
    private readonly defaults: NotificationDefaults,
  ) {}

  /**
   * Deliver a notification through the requested provider, or the configured default
   * @param payload
   */
  async execute(payload: NotificationInput): Promise<void> {
    const provider = payload.provider ?? this.defaults.provider;

    const notifier = this.notifiers.get(provider);

    if (!notifier) {
      throw new NotifierNotFoundError({ provider });
    }

    await notifier.notify(
      Notification.create({
        title: payload.title,
        message: payload.message,
        url: payload.url,
        urlTitle: payload.urlTitle,
        ttl: payload.ttl ?? this.defaults.ttl,
      }),
    );
  }
}
