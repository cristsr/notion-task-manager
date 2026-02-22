import { Prop, Schema, SchemaFactory, ModelDefinition } from '@nestjs/mongoose';
import {
  DailyTaskPriority,
  DailyTaskStatus,
  DailyTaskType,
} from '@daily/domain';

@Schema({ collection: 'tasks' })
export class MongodbDailyTaskEntity {
  @Prop()
  id: string;

  @Prop(String)
  title: string;

  @Prop(Date)
  date: Date;

  @Prop(String)
  status: DailyTaskStatus;

  @Prop(String)
  priority: DailyTaskPriority;

  @Prop(String)
  type: DailyTaskType;

  @Prop(String)
  assignedTo: string;

  @Prop(String)
  createdBy: string;

  @Prop(Date)
  createdAt: Date;

  @Prop([String])
  notificationStages: string[];

  @Prop(String)
  notifiedAt: string;

  @Prop(String)
  url: string;

  @Prop(Boolean)
  hidden: boolean;

  constructor(payload: MongodbDailyTaskEntity) {
    Object.assign(this, payload);
  }
}

export const TaskSchema = SchemaFactory.createForClass(MongodbDailyTaskEntity);

export const MongodbTaskEntityProvider: ModelDefinition = {
  name: MongodbDailyTaskEntity.name,
  schema: TaskSchema,
};
