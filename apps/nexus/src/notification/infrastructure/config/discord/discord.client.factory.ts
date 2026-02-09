import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { GatewayIntentBits } from 'discord.js';
import { DiscordClient } from './discord.client';

export class DiscordClientFactory {
  static getClient() {
    return async (config: ConfigService) => {
      const logger = new Logger('DiscordClientProvider');
      const token = config.get('DISCORD_BOT_TOKEN');

      const client = new DiscordClient({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
      });

      client.on('clientReady', () => {
        logger.log(`Discord bot logged in as ${client.user?.tag}`);
      });

      client.on('error', (error) => {
        logger.error('Discord client error:', error);
      });

      try {
        await client.login(token);
        logger.log('Discord bot initialized successfully');
      } catch (error) {
        logger.error('Failed to login to Discord:', error);
      }

      return client;
    };
  }
}
