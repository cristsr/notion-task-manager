import { Optional } from '@nestjs/common';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  DailyNotificationStage,
  DailyTaskPriority,
  DailyTaskStatus,
  DailyTaskType,
} from '@daily/domain';

export class DailyTaskOutput {
  @IsUUID('4')
  id: string;

  @IsString()
  title: string;

  @IsDateString()
  date: string;

  @IsString()
  assignedTo: string;

  @IsDateString()
  createdAt: string;

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
  @Optional()
  notifiedAt?: string;

  @IsBoolean()
  hidden: boolean;

  url: string;

  constructor(payload: DailyTaskOutput) {
    Object.assign(this, payload);
  }
}
