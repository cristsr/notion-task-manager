import { ConfigService } from '@nestjs/config';
import { CreateTemplatedTasksUsecase } from '@template/application/usecases';
import { TemplateScheduler } from './template.scheduler';

describe('TemplateScheduler', () => {
  const usecase = { execute: jest.fn() };

  const build = (settings: Record<string, string>) =>
    new TemplateScheduler(
      usecase as unknown as CreateTemplatedTasksUsecase,
      { get: (key: string) => settings[key] } as unknown as ConfigService,
    );

  beforeEach(() => jest.clearAllMocks());

  it('delegates the run to CreateTemplatedTasksUsecase', async () => {
    await build({ KANEO_TEMPLATE_PROJECT_ID: 'templates-1' }).createTemplatedTasks();

    expect(usecase.execute).toHaveBeenCalledTimes(1);
  });

  it('does nothing in a deployment that does not use Kaneo', async () => {
    await build({}).createTemplatedTasks();

    expect(usecase.execute).not.toHaveBeenCalled();
  });

  it('logs a failed run instead of letting it escape', async () => {
    usecase.execute.mockRejectedValue(new Error('Kaneo is down'));

    await expect(build({ KANEO_TEMPLATE_PROJECT_ID: 'templates-1' }).createTemplatedTasks()).resolves.toBeUndefined();
  });
});
