import { NotFoundException } from '@shared/domain/exception';

export class OkrTaskNotFoundError extends NotFoundException {
  readonly code = 'OKR_TASK_NOT_FOUND';

  constructor(context: { taskId: string }) {
    super(`OkrTask with id ${context.taskId} not found in source`, { context });
  }
}
