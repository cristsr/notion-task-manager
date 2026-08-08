import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { OkrTask, OkrTaskDataSourcePort, OkrTaskStatus } from '@okr/domain';
import { SyncOkrTaskStatusUsecase } from './sync-okr-task-status.usecase';

describe('SyncOkrTaskStatusUsecase', () => {
  const TASK_ID = Uuid.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301');

  let dataSource: jest.Mocked<OkrTaskDataSourcePort>;
  let usecase: SyncOkrTaskStatusUsecase;

  const buildTask = (status: OkrTaskStatus, progress: number): OkrTask =>
    OkrTask.create({
      id: TASK_ID,
      keyResultId: null,
      objectiveId: null,
      updatedAt: DateTime.local(),
      status,
      progress,
    });

  beforeEach(() => {
    dataSource = {
      fetchById: jest.fn(),
      updateObjective: jest.fn(),
      updateKeyResult: jest.fn(),
      updateProgress: jest.fn(),
      getTasksByKeyResultId: jest.fn(),
      getPendingTasks: jest.fn(),
    } as unknown as jest.Mocked<OkrTaskDataSourcePort>;

    usecase = new SyncOkrTaskStatusUsecase(dataSource);
  });

  it('does nothing when the task is not in the source', async () => {
    dataSource.fetchById.mockResolvedValue(null);

    await expect(usecase.execute(TASK_ID)).resolves.toBeUndefined();
    expect(dataSource.updateProgress).not.toHaveBeenCalled();
  });

  it('pushes the started progress when the task moved to in progress', async () => {
    dataSource.fetchById.mockResolvedValue(buildTask(OkrTaskStatus.IN_PROGRESS, 0));

    await usecase.execute(TASK_ID);

    expect(dataSource.updateProgress).toHaveBeenCalledWith(TASK_ID, 0.1);
  });

  it('pushes the completed progress when a started task is done', async () => {
    dataSource.fetchById.mockResolvedValue(buildTask(OkrTaskStatus.DONE, 0.1));

    await usecase.execute(TASK_ID);

    expect(dataSource.updateProgress).toHaveBeenCalledWith(TASK_ID, 1);
  });

  it('does not write when the progress already matches the status', async () => {
    dataSource.fetchById.mockResolvedValue(buildTask(OkrTaskStatus.DONE, 1));

    await usecase.execute(TASK_ID);

    expect(dataSource.updateProgress).not.toHaveBeenCalled();
  });
});
