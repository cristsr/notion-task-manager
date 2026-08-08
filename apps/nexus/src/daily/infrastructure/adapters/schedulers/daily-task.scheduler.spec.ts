import { Test } from '@nestjs/testing';
import { NotifyDailyTaskUsecase, VisibilityDailyTaskUsecase } from '@daily/application/usecases';
import { DailyTaskScheduler } from './daily-task.scheduler';

describe('DailyTaskScheduler', () => {
  let scheduler: DailyTaskScheduler;

  const notifyTaskUsecase = { execute: jest.fn() };
  const visibilityTaskUsecase = { execute: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const app = await Test.createTestingModule({
      providers: [
        DailyTaskScheduler,
        { provide: NotifyDailyTaskUsecase, useValue: notifyTaskUsecase },
        { provide: VisibilityDailyTaskUsecase, useValue: visibilityTaskUsecase },
      ],
    }).compile();

    scheduler = app.get(DailyTaskScheduler);
  });

  it('delegates the notification run to NotifyDailyTaskUsecase', async () => {
    await scheduler.notifyTasks();

    expect(notifyTaskUsecase.execute).toHaveBeenCalledTimes(1);
    expect(visibilityTaskUsecase.execute).not.toHaveBeenCalled();
  });

  it('delegates the visibility run to VisibilityDailyTaskUsecase', async () => {
    await scheduler.verifyTaskVisibility();

    expect(visibilityTaskUsecase.execute).toHaveBeenCalledTimes(1);
    expect(notifyTaskUsecase.execute).not.toHaveBeenCalled();
  });
});
