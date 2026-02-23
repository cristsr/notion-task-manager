import { ExternalServiceException } from '@shared/application/exceptions';

export class OkrTaskSyncException extends ExternalServiceException {
  constructor(
    context: {
      taskId: string;
      keyResultId?: string;
      objectiveId?: string;
      progress?: number;
    },
    cause: Error,
  ) {
    super('Failed to update OKR task in Datasource', { context, cause });
  }
}
