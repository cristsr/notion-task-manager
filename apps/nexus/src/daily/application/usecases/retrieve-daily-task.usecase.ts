import { Injectable } from '@nestjs/common';
import { DailyTaskRepository } from '@daily/domain';
import { DailyTaskMapper } from '../mappers';
import { DailyTaskOutput } from '../dto';

@Injectable()
export class RetrieveDailyTaskUsecase {
  constructor(private readonly taskRepository: DailyTaskRepository) {}

  /**
   * Retrieve all daily tasks from datasource
   */
  async execute(): Promise<DailyTaskOutput[]> {
    const tasks = await this.taskRepository.getAllTask();
    return tasks.map(DailyTaskMapper.toDTO);
  }
}
