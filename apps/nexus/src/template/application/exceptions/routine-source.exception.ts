import { ExternalServiceException } from '@shared/application/exceptions';

export class RoutineSourceException extends ExternalServiceException {
  constructor(
    context: {
      method: string;
      path: string;
      status?: number;
    },
    cause: Error,
  ) {
    super('Failed to reach the task manager', { context, cause });
  }
}
