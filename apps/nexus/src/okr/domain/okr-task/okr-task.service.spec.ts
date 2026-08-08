import { DateTime } from 'luxon';
import { Uuid } from '@shared/domain/value-objects';
import { KeyResult, KeyResultDataSourcePort } from '../key-result';
import { OkrTask } from './okr-task.entity';
import { OkrTaskStatus } from './okr-task.enum';
import { OkrTaskRepository } from './okr-task.repository';
import { OkrTaskDataSourcePort } from './okr-task-data-source.port';
import { OkrTaskNotFoundError } from './okr-task.exception';
import { OkrTaskService } from './okr-task.service';

describe('OkrTaskService', () => {
  const TASK_ID = Uuid.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301');
  const KEY_RESULT_ID = Uuid.create('0b8a6501-1c1f-4b8e-8b64-7a1a2f3c4d5e');
  const OBJECTIVE_A = Uuid.create('7c9e6679-7425-40de-944b-e07fc1f90ae7');
  const OBJECTIVE_B = Uuid.create('9f8c7a10-2b3c-4d5e-8f90-a1b2c3d4e5f6');

  let repository: jest.Mocked<OkrTaskRepository>;
  let taskDataSource: jest.Mocked<OkrTaskDataSourcePort>;
  let keyResultSource: jest.Mocked<KeyResultDataSourcePort>;
  let service: OkrTaskService;

  const buildTask = (overrides: Partial<OkrTask> = {}): OkrTask =>
    OkrTask.create({
      id: TASK_ID,
      keyResultId: null,
      objectiveId: null,
      updatedAt: DateTime.local().minus({ days: 1 }),
      status: OkrTaskStatus.PENDING,
      progress: 0,
      ...overrides,
    });

  const buildKeyResult = (objectiveId: Uuid | null): KeyResult =>
    KeyResult.create({
      id: KEY_RESULT_ID,
      title: 'Ship the audit',
      objectiveId,
      updatedAt: DateTime.local(),
    });

  beforeEach(() => {
    repository = { save: jest.fn(), findById: jest.fn(), findByKeyResultId: jest.fn(), create: jest.fn(), remove: jest.fn() } as unknown as jest.Mocked<OkrTaskRepository>;
    taskDataSource = {
      fetchById: jest.fn(),
      updateObjective: jest.fn(),
      updateKeyResult: jest.fn(),
      updateProgress: jest.fn(),
      getTasksByKeyResultId: jest.fn(),
      getPendingTasks: jest.fn(),
    } as unknown as jest.Mocked<OkrTaskDataSourcePort>;
    keyResultSource = { fetchById: jest.fn(), fetchAll: jest.fn() } as unknown as jest.Mocked<KeyResultDataSourcePort>;

    service = new OkrTaskService(repository, taskDataSource, keyResultSource);
  });

  describe('syncObjective', () => {
    it('fails with a typed domain error when the task is gone from the source', async () => {
      taskDataSource.fetchById.mockResolvedValue(null);

      await expect(service.syncObjective(TASK_ID)).rejects.toBeInstanceOf(OkrTaskNotFoundError);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('persists a task with no key result without touching the source', async () => {
      taskDataSource.fetchById.mockResolvedValue(buildTask({ keyResultId: null }));

      await service.syncObjective(TASK_ID);

      expect(keyResultSource.fetchById).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('resolves the key result before syncing when the task has one', async () => {
      taskDataSource.fetchById.mockResolvedValue(buildTask({ keyResultId: KEY_RESULT_ID }));
      keyResultSource.fetchById.mockResolvedValue(buildKeyResult(OBJECTIVE_A));

      await service.syncObjective(TASK_ID);

      expect(keyResultSource.fetchById).toHaveBeenCalledWith(KEY_RESULT_ID);
      expect(taskDataSource.updateObjective).toHaveBeenCalledWith(TASK_ID, OBJECTIVE_A);
    });
  });

  describe('execObjectiveSync', () => {
    it('only persists when neither side has an objective', async () => {
      const task = buildTask({ objectiveId: null });

      await service.execObjectiveSync(task, buildKeyResult(null));

      expect(taskDataSource.updateObjective).not.toHaveBeenCalled();
      expect(taskDataSource.updateKeyResult).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(task);
    });

    it('adopts the key result objective when the task has none', async () => {
      const task = buildTask({ objectiveId: null, keyResultId: KEY_RESULT_ID });

      await service.execObjectiveSync(task, buildKeyResult(OBJECTIVE_A));

      expect(taskDataSource.updateObjective).toHaveBeenCalledWith(TASK_ID, OBJECTIVE_A);
      expect(repository.save).toHaveBeenCalledWith(task);
    });

    it('detaches the key result when the key result lost its objective', async () => {
      const task = buildTask({ objectiveId: OBJECTIVE_A, keyResultId: KEY_RESULT_ID });

      await service.execObjectiveSync(task, buildKeyResult(null));

      expect(task.keyResultId).toBeNull();
      expect(taskDataSource.updateKeyResult).toHaveBeenCalledWith(TASK_ID, null);
      expect(repository.save).toHaveBeenCalledWith(task);
    });

    it('realigns the task when both objectives differ', async () => {
      const task = buildTask({ objectiveId: OBJECTIVE_A, keyResultId: KEY_RESULT_ID });

      await service.execObjectiveSync(task, buildKeyResult(OBJECTIVE_B));

      expect(taskDataSource.updateObjective).toHaveBeenCalledWith(TASK_ID, OBJECTIVE_B);
      expect(repository.save).toHaveBeenCalledWith(task);
    });

    it('does not call the source when both objectives already match', async () => {
      const task = buildTask({ objectiveId: OBJECTIVE_A, keyResultId: KEY_RESULT_ID });

      await service.execObjectiveSync(task, buildKeyResult(OBJECTIVE_A));

      expect(taskDataSource.updateObjective).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(task);
    });
  });
});
