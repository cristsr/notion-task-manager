import { Controller, Get } from '@nestjs/common';
import { NotifyDailyTaskUsecase, RetrieveDailyTaskUsecase, SetupDailyTaskUsecase } from '@daily/application/usecases';

@Controller('tasks')
export class DailyTaskController {
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
