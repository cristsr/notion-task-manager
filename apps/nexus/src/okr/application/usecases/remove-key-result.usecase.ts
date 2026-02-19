import { Injectable, Logger } from '@nestjs/common';
import { Uuid } from '@shared/domain/value-objects';
import { KeyResultRepository, OkrTaskRepository } from '@okr/domain';
import { OkrTaskProviderPort } from '@okr/application/ports';

@Injectable()
export class RemoveKeyResultUsecase {
  private readonly logger = new Logger(RemoveKeyResultUsecase.name);

  constructor(
    private readonly keyResultRepository: KeyResultRepository,
    private readonly okrTaskRepository: OkrTaskRepository,
    private readonly okrTaskProvider: OkrTaskProviderPort,
  ) {}

  async execute(keyResultId: Uuid): Promise<void> {
    const tasks = await this.okrTaskRepository.findByKeyResultId(keyResultId);

    this.logger.log('Cleaning objectives from related tasks', {
      keyResultId: keyResultId.value,
      taskCount: tasks.length,
    });

    for (const task of tasks) {
      try {
        await this.okrTaskProvider.updateObjective(task.id, null);

        task.unlinkFromKeyResult();

        await this.okrTaskRepository.save(task);

        this.logger.debug('Cleared task objective and keyResult', {
          taskId: task.id.value,
        });
      } catch (error) {
        this.logger.error('Failed to clear task objective', {
          taskId: task.id.value,
          message: error.message,
        });
      }
    }

    await this.keyResultRepository.remove(keyResultId);

    this.logger.log('Removed KeyResult from cache', {
      keyResultId: keyResultId.value,
    });
  }
}
