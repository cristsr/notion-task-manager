import { ConfigService } from '@nestjs/config';
import { LogLevel } from '@notionhq/client';
import { NotionClient } from './notion.client';

export class NotionClientFactory {
  static getClient() {
    return (config: ConfigService) => {
      return new NotionClient({
        auth: config.get('NOTION_API_TOKEN'),
        logLevel: LogLevel.ERROR,
      });
    };
  }
}
