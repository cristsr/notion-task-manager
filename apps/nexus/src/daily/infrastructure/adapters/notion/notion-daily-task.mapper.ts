import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { DailyTask, DailyTaskStatus, DailyTaskType } from '@daily/domain';

export class NotionDailyTaskMapper {
  static toDomain(input: PageObjectResponse): DailyTask {
    const typeMap: Record<string, DailyTaskType> = {
      Normal: DailyTaskType.NORMAL,
      Scheduled: DailyTaskType.SCHEDULED,
      Recurrent: DailyTaskType.RECURRENT,
    };

    const StatusMap: Record<string, DailyTaskStatus> = {
      'Not started': DailyTaskStatus.NOT_STARTED,
      'In progress': DailyTaskStatus.IN_PROGRESS,
      Done: DailyTaskStatus.DONE,
    };

    //prettier-ignore
    return DailyTask.create({
      id: Uuid.create(input.id),
      title: input.properties.Name['title'][0].text.content,
      status: StatusMap[input.properties['📊 Status']['status'].name],
      assignedTo: input.properties['👦 Assigned To']['people'][0].person.email,
      createdAt: DateTime.fromISO(input.properties['📅 Created At']['created_time']),
      createdBy: input.properties['👮‍♀️ Created By']['created_by'].person.email,
      date: DateTime.fromISO(input.properties['📅 Date']['date'].start),
      priority: input.properties['🚨 Priority']['select'].name,
      type: typeMap[input.properties['📋 Type']['select'].name],
      hidden: input.properties['👁 Hidden']['checkbox'],
      url: input.url,
      notificationStages: [],
      notifiedAt: null,
    });
  }
}
