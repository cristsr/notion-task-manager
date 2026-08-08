import { Injectable, Logger } from '@nestjs/common';
import dedent from 'dedent';
import { DailyTaskNotifierPort } from '@daily/application/ports';
import { DailyTask } from '@daily/domain';
import { SendNotificationUsecase } from '@notification/application/usecases';
import { NotificationInput } from '@notification/application/dto';
import { I18nService } from '@shared/infrastructure/config/i18n';

@Injectable()
export class DailyTaskNotifier implements DailyTaskNotifierPort {
  private readonly logger = new Logger(DailyTaskNotifier.name);

  constructor(
    private readonly sendNotificationUsecase: SendNotificationUsecase,
    private readonly i18n: I18nService,
  ) {}

  async notify(task: DailyTask): Promise<void> {
    const notification = this.formatNotification(task);

    await this.sendNotificationUsecase.execute(notification);

    this.logger.log(
      `Notification sent for task [${task.id.value}] ${task.title} - Stage: ${task.getNotificationStage()}`,
    );
  }

  private formatNotification(task: DailyTask): NotificationInput {
    const endTime = task.date.toLocaleString({
      hour: 'numeric',
      minute: 'numeric',
    });

    const stage = task.getNotificationStage();

    const stageLabel = this.i18n.t(`notification.stages.${stage}`);

    const endTimeLabel = this.i18n.t('notification.endTime', {
      time: endTime,
    });

    const urlTitle = this.i18n.t('notification.urlTitle');

    const message = dedent`
      🔔 ${stageLabel}
      ⏲ ${endTimeLabel}
    `;

    return new NotificationInput({
      message,
      title: task.title,
      url: task.url,
      urlTitle: `🌎 ${urlTitle}`,
    });
  }
}
