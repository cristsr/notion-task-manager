import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { DailyNotificationStage, DailyTask } from '@daily/domain';
import { MongodbDailyTaskEntity } from './mongodb-daily-task.entity';

export class MongodbDailyTaskMapper {
  static toEntity(task: DailyTask): MongodbDailyTaskEntity {
    return new MongodbDailyTaskEntity({
      id: task.id.value,
      date: task.date.toJSDate(),
      title: task.title,
      status: task.status,
      type: task.type,
      assignedTo: task.assignedTo,
      priority: task.priority,
      createdAt: task.createdAt.toJSDate(),
      createdBy: task.createdBy,
      notificationStages: task.notificationStages,
      notifiedAt: task.notifiedAt?.toISO(),
      hidden: task.hidden,
      url: task.url,
    });
  }

  static toDomain(task: MongodbDailyTaskEntity): DailyTask {
    const payload: Partial<DailyTask> = {
      id: Uuid.create(task.id),
      date: DateTime.fromJSDate(task.date),
      title: task.title,
      status: task.status,
      type: task.type,
      assignedTo: task.assignedTo,
      priority: task.priority,
      createdAt: DateTime.fromJSDate(task.createdAt),
      createdBy: task.createdBy,
      notificationStages: task.notificationStages as DailyNotificationStage[],
      hidden: task.hidden,
      url: task.url,
    };

    if (task.notifiedAt) {
      payload.notifiedAt = DateTime.fromISO(task.notifiedAt);
    }

    return DailyTask.create(payload as DailyTask);
  }
}
