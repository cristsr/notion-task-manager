import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotifierPort } from '../../../application/ports';
import { NotifierTypes } from '../../../application/types';
import { Notification } from '../../../domain';

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
  notify(payload: Notification): void {
    const url = this.config.get('PUSHOVER_URL') + '/1/messages.json';
    const token = this.config.get('PUSHOVER_API_KEY');
    const user = this.config.get('PUSHOVER_API_USER');

    this.http
      .post(
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
      )
      .subscribe({
        next: () => {
          this.logger.log(`Pushover notification sent successfully`);
        },
        error: (error) => {
          this.logger.error(error.message);
        },
      });
  }
}
