import { ConfigService } from '@nestjs/config';
import { NotificationDefaults } from '@notification/application/ports';
import { NotifierTypes } from '@notification/application/types';

export class NotificationDefaultsFactory {
  static create() {
    return (config: ConfigService): NotificationDefaults => ({
      provider: config.get<NotifierTypes>('NOTIFICATION_PROVIDER'),
      ttl: +config.get('NOTIFICATION_TTL'),
    });
  }
}
