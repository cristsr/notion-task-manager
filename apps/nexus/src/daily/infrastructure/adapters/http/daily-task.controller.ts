import { Controller, Get, Logger } from '@nestjs/common';
import {
  NotifyDailyTaskUsecase,
  RetrieveDailyTaskUsecase,
  SetupDailyTaskUsecase,
} from '@daily/application/usecases';

@Controller('tasks')
export class DailyTaskController {
  private readonly logger = new Logger(DailyTaskController.name);

  constructor(
    private readonly notifyTaskUsecase: NotifyDailyTaskUsecase,
    private readonly retrieveTaskUsecase: RetrieveDailyTaskUsecase,
    private readonly syncTaskUsecase: SetupDailyTaskUsecase,
  ) {}

  @Get()
  getTasks() {
    return this.retrieveTaskUsecase.execute();
  }

  @Get('sync')
  syncTasks() {
    return this.syncTaskUsecase.execute();
  }

  @Get('notify')
  notifyTask() {
    return this.notifyTaskUsecase.execute();
  }
}
