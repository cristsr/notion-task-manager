import { Injectable } from '@nestjs/common';
import { Uuid } from '@shared/domain/value-objects';
import { KeyResultDataSourcePort, OkrTaskDataSourcePort, OkrTaskService } from '@okr/domain';
import { bufferCount, concatMap, delay, forkJoin, from, lastValueFrom } from 'rxjs';

@Injectable()
export class SyncOkrKeyResultUsecase {
  constructor(
    private readonly keyResultDataSource: KeyResultDataSourcePort,
    private readonly okrTaskService: OkrTaskService,
    private readonly okrTaskDataSource: OkrTaskDataSourcePort,
  ) {}

  async execute(keyResultId: Uuid): Promise<void> {
    const keyResult = await this.keyResultDataSource.fetchById(keyResultId);

    const tasks = await this.okrTaskDataSource.getTasksByKeyResultId(keyResultId);

    if (!tasks.length) return;

    await lastValueFrom(
      from(tasks).pipe(
        bufferCount(3),
        concatMap((tasks) =>
          forkJoin(tasks.map((task) => this.okrTaskService.execObjectiveSync(task, keyResult))).pipe(delay(1000)),
        ),
      ),
    );
  }
}
