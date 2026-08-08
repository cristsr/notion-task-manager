import { Injectable } from '@nestjs/common';
import { Uuid } from '@shared/domain/value-objects';
import { OkrTaskDataSourcePort } from '@okr/domain';

@Injectable()
export class SyncOkrTaskStatusUsecase {
  constructor(private readonly okrTaskDataSource: OkrTaskDataSourcePort) {}

  /**
   * Push the task progress derived from its status back to the data source
   * @param taskId
   */
  async execute(taskId: Uuid): Promise<void> {
    const task = await this.okrTaskDataSource.fetchById(taskId);

    if (!task) return;

    if (!task.syncProgressWithStatus()) return;

    await this.okrTaskDataSource.updateProgress(taskId, task.progress);
  }
}
