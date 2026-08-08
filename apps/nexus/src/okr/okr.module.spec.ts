import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { NotionClient } from '@shared/infrastructure/config/notion';
import { KeyResultDataSourcePort, KeyResultRepository, OkrTaskDataSourcePort, OkrTaskRepository, OkrTaskService } from '@okr/domain';
import { OkrKeyResultEventHandler, OkrTaskEventHandler } from './infrastructure/adapters/events';
import { MongodbKeyResultEntity, MongodbOkrTaskEntity } from './infrastructure/adapters/persistence/mongodb';
import { SetupOkrBootstrap } from './infrastructure/adapters/bootstrap';
import { OkrModule } from './okr.module';

/** Stands in for the global SharedModule, which owns the Notion client. */
@Global()
@Module({
  providers: [{ provide: NotionClient, useValue: {} }],
  exports: [NotionClient],
})
class StubSharedModule {}

describe('OkrModule wiring', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), StubSharedModule, OkrModule],
    })
      .overrideProvider(getModelToken(MongodbOkrTaskEntity.name))
      .useValue({})
      .overrideProvider(getModelToken(MongodbKeyResultEntity.name))
      .useValue({})
      .compile();
  });

  afterAll(async () => {
    await module?.close();
  });

  it('binds every port to a concrete adapter', () => {
    expect(module.get(OkrTaskRepository)).toBeDefined();
    expect(module.get(KeyResultRepository)).toBeDefined();
    expect(module.get(OkrTaskDataSourcePort)).toBeDefined();
    expect(module.get(KeyResultDataSourcePort)).toBeDefined();
  });

  it('builds the domain service without framework decorators', () => {
    expect(module.get(OkrTaskService)).toBeInstanceOf(OkrTaskService);
  });

  // Regression: this handler existed but was never listed in `providers`,
  // so every Key Result webhook was silently dropped.
  it('registers both notion event handlers', () => {
    expect(module.get(OkrTaskEventHandler)).toBeInstanceOf(OkrTaskEventHandler);
    expect(module.get(OkrKeyResultEventHandler)).toBeInstanceOf(OkrKeyResultEventHandler);
  });

  it('registers the bootstrap adapter', () => {
    expect(module.get(SetupOkrBootstrap)).toBeInstanceOf(SetupOkrBootstrap);
  });
});
