import { Injectable } from '@nestjs/common';
import { Uuid } from '@shared/domain/value-objects';
import { OkrTaskDataSourcePort, OkrTaskStatus } from '@okr/domain';
import { match } from 'ts-pattern';

@Injectable()
export class SyncOkrTaskStatusUsecase {
  constructor(private readonly okrTaskDataSource: OkrTaskDataSourcePort) {}

  async execute(taskId: Uuid): Promise<void> {
    const task = await this.okrTaskDataSource.fetchById(taskId);

    await match([task.status, task.hasProgress()])
      .with([OkrTaskStatus.IN_PROGRESS, false], async () => {
        task.setProgress(0.1);
        await this.okrTaskDataSource.updateProgress(taskId, task.progress);
      })
      .with([OkrTaskStatus.DONE, true], async () => {
        task.setProgress(1);
        await this.okrTaskDataSource.updateProgress(taskId, task.progress);
      })
      .otherwise(() => {});
  }
}
