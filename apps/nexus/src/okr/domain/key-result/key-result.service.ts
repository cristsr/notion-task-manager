import { Uuid } from '@shared/domain/value-objects';
import { OkrTaskDataSourcePort, OkrTaskService } from '../okr-task';
import { KeyResultSourcePort } from './key-result-source.port';

export class KeyResultService {
  constructor(
    private readonly keyResultSource: KeyResultSourcePort,
    private readonly okrTaskService: OkrTaskService,
    private readonly okrTaskDataSource: OkrTaskDataSourcePort,
  ) {}

  async syncKeyResult(keyResultId: Uuid): Promise<void> {
    const keyResult = await this.keyResultSource.fetchById(keyResultId);

    const tasks = await this.okrTaskDataSource.getTasksByKeyResultId(keyResultId);

    if (!tasks.length) return;

    for (const task of tasks) {
      await this.okrTaskService.execObjectiveSync(task, keyResult);
    }
  }
}
