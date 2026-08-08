import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextChannel, EmbedBuilder } from 'discord.js';
import { NotifierPort } from '@notification/application/ports';
import { NotifierTypes } from '@notification/application/types';
import { DiscordClient } from '../../config/discord';
import { Notification } from '@notification/domain';
import { NotificationDeliveryException } from '@notification/application/exceptions';
import dedent from 'dedent';

@Injectable()
export class DiscordNotifierService implements NotifierPort {
  readonly instance = NotifierTypes.DISCORD;
  private readonly logger = new Logger(DiscordNotifierService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly client: DiscordClient,
  ) {}

  /**
   * Notify to discord
   * @param payload
   */
  async notify(payload: Notification): Promise<void> {
    const context = { provider: this.instance, title: payload.title };

    if (!this.client.isReady()) {
      throw new NotificationDeliveryException({ ...context, reason: 'Discord client is not ready' });
    }

    const channelId = this.config.get('DISCORD_CHANNEL_ID');

    if (!channelId) {
      throw new NotificationDeliveryException({ ...context, reason: 'DISCORD_CHANNEL_ID is not configured' });
    }

    const channel = await this.fetchTextChannel(channelId, context);

    try {
      await channel.send({ embeds: [this.buildEmbed(payload)] });
    } catch (error) {
      throw new NotificationDeliveryException({ ...context, reason: 'Discord rejected the message' }, error);
    }

    this.logger.log('Discord notification sent successfully');
  }

  private async fetchTextChannel(channelId: string, context: { provider: string; title: string }) {
    const channel = await this.client.channels.fetch(channelId).catch((error) => {
      throw new NotificationDeliveryException({ ...context, reason: 'Failed to fetch Discord channel' }, error);
    });

    if (!(channel instanceof TextChannel)) {
      throw new NotificationDeliveryException({ ...context, reason: 'Discord channel is not a text channel' });
    }

    return channel;
  }

  private buildEmbed(payload: Notification): EmbedBuilder {
    const message = dedent`
      •
      ${payload.message}
    `;

    const embed = new EmbedBuilder()
      .setTitle(payload.title)
      .setDescription(message.trim())
      .setColor('#f2e558')
      .setAuthor({
        name: 'Notifier',
      })
      .setThumbnail(this.config.get('DISCORD_THUMBNAIL_URL'))
      .setFooter({
        text: `Notifier`,
      })
      .setTimestamp();

    if (payload.url) {
      embed.setURL(payload.url);
    }

    return embed;
  }
}
