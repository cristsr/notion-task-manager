import { Prop, Schema, SchemaFactory, ModelDefinition } from '@nestjs/mongoose';
import { Nullable } from '@shared/domain/types';
import { OkrTaskStatus } from '@okr/domain';

@Schema({ collection: 'okr_tasks' })
export class MongodbOkrTaskEntity {
  @Prop({ required: true })
  id: string;

  @Prop({ type: String, default: null })
  keyResultId: Nullable<string>;

  @Prop({ type: String, default: null })
  objectiveId: Nullable<string>;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: String, default: OkrTaskStatus.PENDING })
  status: OkrTaskStatus;

  @Prop({ type: Number, default: 0 })
  progress: number;

  constructor(payload: MongodbOkrTaskEntity) {
    Object.assign(this, payload);
  }
}

export const OkrTaskSchema = SchemaFactory.createForClass(MongodbOkrTaskEntity);

export const MongodbOkrTaskEntityProvider: ModelDefinition = {
  name: MongodbOkrTaskEntity.name,
  schema: OkrTaskSchema,
};
