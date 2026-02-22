import { DailyTask } from '@daily/domain';
import { DailyTaskOutput } from '../dto';

export class DailyTaskMapper {
  /**
   * Map daily task to daily task output dto
   * @param task
   */
  static toDTO(task: DailyTask): DailyTaskOutput {
    return new DailyTaskOutput({
      id: task.id.value,
      title: task.title,
      assignedTo: task.assignedTo,
      createdAt: task.createdAt.toISO(),
      createdBy: task.createdBy,
      date: task.date.toISO(),
      priority: task.priority,
      status: task.status,
      type: task.type,
      notificationStages: task.notificationStages,
      notifiedAt: task.notifiedAt?.toISO(),
      hidden: task.hidden,
      url: task.url,
    });
  }
}
