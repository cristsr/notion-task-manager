import { IsDate, IsDateString, IsIn, IsString, IsUUID } from 'class-validator';
import {
  DailyNotificationStage,
  DailyTaskPriority,
  DailyTaskStatus,
  DailyTaskType,
} from '@daily/domain';

export class DailyTaskInput {
  @IsUUID('4')
  id: string;

  @IsDate()
  date: Date;

  @IsString()
  assignedTo: string;

  @IsDate()
  createdAt: Date;

  @IsString()
  createdBy: string;

  @IsString()
  @IsIn(Object.values(DailyTaskPriority))
  priority: DailyTaskPriority;

  @IsString()
  @IsIn(Object.values(DailyTaskStatus))
  status: DailyTaskStatus;

  @IsString()
  @IsIn(Object.values(DailyTaskType))
  type: DailyTaskType;

  @IsIn(Object.values(DailyNotificationStage), { each: true })
  notificationStages: DailyNotificationStage[];

  @IsDateString()
  notifiedAt: string;
}
