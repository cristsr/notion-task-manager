import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotifierPort } from '@notification/application/ports';
import { NotifierTypes } from '@notification/application/types';
import { Notification } from '@notification/domain';
import { NotificationDeliveryException } from '@notification/application/exceptions';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PushoverNotifierService implements NotifierPort {
  readonly instance = NotifierTypes.PUSHOVER;
  private readonly logger = new Logger(PushoverNotifierService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  /**
   * Notify
   * @param payload
   */
  async notify(payload: Notification): Promise<void> {
    const url = this.config.get('PUSHOVER_URL') + '/1/messages.json';
    const token = this.config.get('PUSHOVER_API_KEY');
    const user = this.config.get('PUSHOVER_API_USER');

    try {
      await lastValueFrom(
        this.http.post(
          url,
          new URLSearchParams({
            token,
            user,
            message: payload.message,
            title: payload.title,
            url: payload.url,
            url_title: payload.urlTitle,
            ttl: payload.ttl.toString(),
          }),
        ),
      );
    } catch (error) {
      throw new NotificationDeliveryException(
        { provider: this.instance, title: payload.title, reason: 'Pushover rejected the request' },
        error,
      );
    }

    this.logger.log(`Pushover notification sent successfully`);
  }
}
