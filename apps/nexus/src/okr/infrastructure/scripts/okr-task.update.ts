import { KeyResultDataSourcePort, OkrTaskDataSourcePort, OkrTaskService } from '@okr/domain';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OkrTaskUpdate {
  private readonly logger = new Logger(OkrTaskUpdate.name);

  constructor(
    private readonly okrTaskDataSource: OkrTaskDataSourcePort,
    private readonly okrTaskService: OkrTaskService,
    private readonly okrKeyResultDataSource: KeyResultDataSourcePort,
  ) {}

  async execute(): Promise<void> {
    const tasks = await this.okrTaskDataSource.getPendingTasks();
    const keyResults = await this.okrKeyResultDataSource.fetchAll();

    for (const task of tasks) {
      const keyResult = keyResults.find((kr) => kr.id.equals(task.keyResultId));
      await this.okrTaskService.execObjectiveSync(task, keyResult);
      this.logger.log(`Updated task ${task.id.value}`);
    }
    console.log('process finished');
  }
}
