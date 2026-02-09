import { Test } from '@nestjs/testing';
import { DailyTaskScheduler } from './daily-task.scheduler';

describe('TaskScheduler', () => {
  let service: DailyTaskScheduler;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [DailyTaskScheduler],
    }).compile();

    service = app.get<DailyTaskScheduler>(DailyTaskScheduler);
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      expect(service).toBeDefined();
    });
  });
});
