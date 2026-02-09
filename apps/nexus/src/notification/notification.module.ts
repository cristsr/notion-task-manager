import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DiscordNotifierService,
  PushoverNotifierService,
  NotificationsController,
} from './infrastructure/adapters';
import { SendNotificationUsecase } from './application/usecases';
import {
  DiscordClient,
  DiscordClientFactory,
} from './infrastructure/config/discord';
import { NotifierFactory } from './infrastructure/config/notifier';
import { NOTIFIERS } from './application/ports';

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
      provide: DiscordClient,
      useFactory: DiscordClientFactory.getClient(),
      inject: [ConfigService],
    },
  ],
  exports: [SendNotificationUsecase],
})
export class NotificationModule {}
