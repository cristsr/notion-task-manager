import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { KeyResultRepository, KeyResult } from '@okr/domain';
import { MongodbKeyResultEntity } from './mongodb-key-result.entity';
import { MongodbKeyResultMapper } from './mongodb-key-result.mapper';

@Injectable()
export class MongodbKeyResultRepository implements KeyResultRepository {
  constructor(
    @InjectModel(MongodbKeyResultEntity.name)
    private readonly keyResultModel: Model<MongodbKeyResultEntity>,
  ) {}

  async findById(id: Uuid): Promise<Nullable<KeyResult>> {
    const keyResult = await this.keyResultModel
      .findOne({ id: id.value })
      .exec();
    if (!keyResult) return null;
    return MongodbKeyResultMapper.toDomain(keyResult);
  }

  async findAll(): Promise<KeyResult[]> {
    const keyResults = await this.keyResultModel.find().exec();
    return keyResults.map(MongodbKeyResultMapper.toDomain);
  }

  async save(keyResult: KeyResult): Promise<void> {
    const existing = await this.findById(keyResult.id);

    if (!existing) {
      await this.keyResultModel.create(
        MongodbKeyResultMapper.toEntity(keyResult),
      );
      return;
    }

    await this.keyResultModel
      .updateOne(
        { id: keyResult.id.value },
        { $set: MongodbKeyResultMapper.toEntity(keyResult) },
      )
      .exec();
  }

  async saveMany(keyResults: KeyResult[]): Promise<void> {
    const operations = keyResults.map((kr) => ({
      updateOne: {
        filter: { id: kr.id.value },
        update: { $set: MongodbKeyResultMapper.toEntity(kr) },
        upsert: true,
      },
    }));

    await this.keyResultModel.bulkWrite(operations);
  }

  async remove(id: Uuid): Promise<void> {
    await this.keyResultModel.deleteOne({ id: id.value }).exec();
  }
}
