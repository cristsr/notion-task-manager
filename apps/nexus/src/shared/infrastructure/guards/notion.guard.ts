import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotionGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const NOTION_WEBHOOK_KEY = this.config.get('NOTION_WEBHOOK_KEY');
    const request = context.switchToHttp().getRequest();
    const query = request.query;
    return query.key === NOTION_WEBHOOK_KEY;
  }
}
