import { Body, Controller, Post } from '@nestjs/common';
import { NotificationInput } from '@notification/application/dto';
import { SendNotificationUsecase } from '@notification/application/usecases';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUsecase,
  ) {}

  @Post('notify')
  sendNotification(@Body() data: NotificationInput): Promise<void> {
    return this.sendNotificationUseCase.execute(data);
  }
}
