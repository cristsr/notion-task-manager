import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { NotionClient } from '@shared/infrastructure/config/notion';
import { I18nService } from '@shared/infrastructure/config/i18n';
import { DiscordClient } from '@notification/infrastructure/config/discord';
import { DailyTaskRepository } from '@daily/domain';
import { DailyTaskDataSourcePort, DailyTaskNotifierPort } from './application/ports';
import { DailyTaskEventHandler } from './infrastructure/adapters/events';
import { SetupDailyTaskBootstrap } from './infrastructure/adapters/bootstrap';
import { DailyTaskScheduler } from './infrastructure/adapters/schedulers';
import { MongodbDailyTaskEntity } from './infrastructure/adapters/persistence/mongodb/task';
import { TaskModule } from './task.module';

/** Stands in for the global SharedModule. */
@Global()
@Module({
  providers: [
    { provide: NotionClient, useValue: {} },
    { provide: I18nService, useValue: { t: (key: string) => key } },
  ],
  exports: [NotionClient, I18nService],
})
class StubSharedModule {}

describe('TaskModule wiring', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      // NotificationModule relies on HttpModule being registered globally by AppModule
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        HttpModule.register({ global: true }),
        StubSharedModule,
        TaskModule,
      ],
    })
      .overrideProvider(getModelToken(MongodbDailyTaskEntity.name))
      .useValue({})
      .overrideProvider(DiscordClient)
      .useValue({ isReady: () => false })
      .compile();
  });

  afterAll(async () => {
    await module?.close();
  });

  it('binds every port to a concrete adapter', () => {
    expect(module.get(DailyTaskRepository)).toBeDefined();
    expect(module.get(DailyTaskDataSourcePort)).toBeDefined();
    expect(module.get(DailyTaskNotifierPort)).toBeDefined();
  });

  it('registers the driving adapters', () => {
    expect(module.get(DailyTaskEventHandler)).toBeInstanceOf(DailyTaskEventHandler);
    expect(module.get(SetupDailyTaskBootstrap)).toBeInstanceOf(SetupDailyTaskBootstrap);
    expect(module.get(DailyTaskScheduler)).toBeInstanceOf(DailyTaskScheduler);
  });
});
