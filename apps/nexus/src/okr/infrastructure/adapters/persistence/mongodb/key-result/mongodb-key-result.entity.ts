import { Prop, Schema, SchemaFactory, ModelDefinition } from '@nestjs/mongoose';
import { Nullable } from '@shared/domain/types';

@Schema({ collection: 'okr_key_results' })
export class MongodbKeyResultEntity {
  @Prop({ required: true })
  id: string;

  @Prop({ type: String, default: null })
  objectiveId: Nullable<string>;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: String, default: '' })
  title: string;

  constructor(payload: MongodbKeyResultEntity) {
    Object.assign(this, payload);
  }
}

export const KeyResultSchema = SchemaFactory.createForClass(MongodbKeyResultEntity);

export const MongodbKeyResultEntityProvider: ModelDefinition = {
  name: MongodbKeyResultEntity.name,
  schema: KeyResultSchema,
};
