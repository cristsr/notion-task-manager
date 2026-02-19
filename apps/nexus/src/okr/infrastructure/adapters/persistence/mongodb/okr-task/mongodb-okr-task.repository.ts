import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Uuid } from '@shared/domain/value-objects';
import { Nullable } from '@shared/domain/types';
import { OkrTaskRepository, OkrTask } from '@okr/domain';
import { MongodbOkrTaskEntity } from './mongodb-okr-task.entity';
import { MongodbOkrTaskMapper } from './mongodb-okr-task.mapper';

@Injectable()
export class MongodbOkrTaskRepository implements OkrTaskRepository {
  constructor(
    @InjectModel(MongodbOkrTaskEntity.name)
    private readonly taskModel: Model<MongodbOkrTaskEntity>,
  ) {}

  async findById(id: Uuid): Promise<Nullable<OkrTask>> {
    const task = await this.taskModel.findOne({ id: id.value }).exec();
    if (!task) return null;
    return MongodbOkrTaskMapper.toDomain(task);
  }

  async findByKeyResultId(keyResultId: Uuid): Promise<OkrTask[]> {
    const tasks = await this.taskModel
      .find({ keyResultId: keyResultId.value })
      .exec();
    return tasks.map(MongodbOkrTaskMapper.toDomain);
  }

  async save(task: OkrTask): Promise<void> {
    const existingTask = await this.findById(task.id);

    if (!existingTask) {
      await this.taskModel.create(MongodbOkrTaskMapper.toEntity(task));
      return;
    }

    await this.taskModel
      .updateOne(
        { id: task.id.value },
        { $set: MongodbOkrTaskMapper.toEntity(task) },
      )
      .exec();
  }

  async remove(id: Uuid): Promise<void> {
    await this.taskModel.deleteOne({ id: id.value }).exec();
  }
}
