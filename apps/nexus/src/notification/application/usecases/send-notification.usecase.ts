import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NOTIFIERS } from '../ports';
import { NotificationInput } from '../dto';
import { Notifiers } from '../types';
import { ConfigService } from '@nestjs/config';
import { Notification } from '../../domain';

@Injectable()
export class SendNotificationUsecase {
  constructor(
    @Inject(NOTIFIERS)
    private readonly notifiers: Notifiers,
    private readonly config: ConfigService,
  ) {}

  execute(payload: NotificationInput): void {
    // prettier-ignore
    const  provider = payload.provider ?? this.config.get('NOTIFICATION_PROVIDER');

    const notifier = this.notifiers.get(provider);

    if (!notifier) {
      throw new NotFoundException(`Notifier provider not found: ${provider}`);
    }

    notifier.notify(
      Notification.create({
        title: payload.title,
        message: payload.message,
        url: payload.url,
        urlTitle: payload.urlTitle,
        ttl: payload.ttl ?? +this.config.get('NOTIFICATION_TTL'),
      }),
    );
  }
}
