import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { RoutineTaskPort, TaskTemplateSourcePort } from './application/ports';
import { CreateTemplatedTasksUsecase } from './application/usecases';
import { KaneoRoutineTaskProvider, KaneoTaskTemplateProvider } from './infrastructure/adapters/kaneo';
import { TemplateScheduler } from './infrastructure/adapters/schedulers';
import { TemplateModule } from './template.module';

describe('TemplateModule wiring', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      // The Kaneo client relies on HttpModule being registered globally by AppModule
      imports: [ConfigModule.forRoot({ isGlobal: true }), HttpModule.register({ global: true }), TemplateModule],
    }).compile();
  });

  afterAll(async () => {
    await module?.close();
  });

  it('binds every port to its Kaneo adapter', () => {
    expect(module.get(TaskTemplateSourcePort)).toBeInstanceOf(KaneoTaskTemplateProvider);
    expect(module.get(RoutineTaskPort)).toBeInstanceOf(KaneoRoutineTaskProvider);
  });

  it('registers the use case and the driving adapter', () => {
    expect(module.get(CreateTemplatedTasksUsecase)).toBeInstanceOf(CreateTemplatedTasksUsecase);
    expect(module.get(TemplateScheduler)).toBeInstanceOf(TemplateScheduler);
  });
});
