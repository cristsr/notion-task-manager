import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiscordNotifierService, PushoverNotifierService, NotificationsController } from './infrastructure/adapters';
import { SendNotificationUsecase } from './application/usecases';
import { DiscordClient, DiscordClientFactory } from './infrastructure/config/discord';
import { NotifierFactory, NotificationDefaultsFactory } from './infrastructure/config/notifier';
import { NOTIFIERS, NotificationDefaults } from './application/ports';

@Module({
  imports: [],
  controllers: [NotificationsController],
  providers: [
    DiscordNotifierService,
    PushoverNotifierService,
    SendNotificationUsecase,
    {
      provide: NOTIFIERS,
      useFactory: NotifierFactory.createNotifiers(),
      inject: [DiscordNotifierService, PushoverNotifierService],
    },
    {
      provide: NotificationDefaults,
      useFactory: NotificationDefaultsFactory.create(),
      inject: [ConfigService],
    },
    {
      provide: DiscordClient,
      useFactory: DiscordClientFactory.getClient(),
      inject: [ConfigService],
    },
  ],
  exports: [SendNotificationUsecase],
})
export class NotificationModule {}
