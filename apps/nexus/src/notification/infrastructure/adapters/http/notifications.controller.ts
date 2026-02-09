import { Body, Controller, Post } from '@nestjs/common';
import { NotificationInput } from '../../../application/dto';
import { SendNotificationUsecase } from '../../../application/usecases';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUsecase,
  ) {}

  @Post('notify')
  sendNotification(@Body() data: NotificationInput): void {
    this.sendNotificationUseCase.execute(data);
  }
}
