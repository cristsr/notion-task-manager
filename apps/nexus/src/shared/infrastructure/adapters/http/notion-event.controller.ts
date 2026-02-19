import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { EventEmitter } from '@shared/application/ports';
import { NotionEventInput } from '../../dtos';
import { Public } from '../../decorators';
import { NotionGuard } from '../../guards';

@Controller('notion')
export class NotionEventController {
  private readonly logger = new Logger(NotionEventController.name);
  constructor(private readonly eventEmitter: EventEmitter) {}

  @Public()
  @UseGuards(NotionGuard)
  @Post('webhook')
  onEvent(@Body() event: NotionEventInput) {
    this.logger.log({
      message: 'Notion event received',
      event,
    });

    this.eventEmitter.emit('notion.event', event);
  }
}
