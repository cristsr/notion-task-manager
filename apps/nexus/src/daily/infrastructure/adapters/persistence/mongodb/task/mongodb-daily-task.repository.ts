import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Uuid } from '@shared/domain/value-objects';
import { DailyTaskRepository, DailyTask } from '@daily/domain';
import { MongodbDailyTaskMapper } from './mongodb-daily-task.mapper';

@Injectable()
export class MongodbDailyTaskRepository implements DailyTaskRepository {
  constructor(
    @InjectModel(MongodbDailyTaskEntity.name)
    private readonly taskEntity: Model<MongodbDailyTaskEntity>,
  ) {}

  async findById(id: Uuid): Promise<DailyTask | null> {
    const task = await this.taskEntity.findOne({ id: id.value }).exec();
    if (!task) return null;
    return MongodbDailyTaskMapper.toDomain(task);
  }

  async getAllTask(): Promise<DailyTask[]> {
    const tasks = await this.taskEntity.find().exec();
    return tasks.map(MongodbDailyTaskMapper.toDomain);
  }

  async insert(task: DailyTask): Promise<void> {
    await this.taskEntity.insertOne(MongodbDailyTaskMapper.toEntity(task));
  }

  async update(task: DailyTask): Promise<void> {
    await this.taskEntity.updateOne(
      {
        id: task.id.value,
      },
      {
        $set: MongodbDailyTaskMapper.toEntity(task),
      },
    );
  }

  async save(task: DailyTask): Promise<void> {
    const existTask = await this.findById(task.id);

    if (!existTask) {
      await this.taskEntity.insertOne(MongodbDailyTaskMapper.toEntity(task));
      return;
    }

    await this.taskEntity
      .updateOne(
        {
          id: task.id.value,
        },
        {
          $set: MongodbDailyTaskMapper.toEntity(task),
        },
      )
      .exec();
  }

  async remove(task: DailyTask): Promise<void> {
    await this.taskEntity
      .deleteOne({
        id: task.id.value,
      })
      .exec();
  }
}
import { MongodbDailyTaskEntity } from './mongodb-daily-task.entity';
import { Model } from 'mongoose';
