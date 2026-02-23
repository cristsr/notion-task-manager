import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SetupOkrUsecase } from '@okr/application/usecases';
import { ErrorLogFormatter } from '@shared/infrastructure/logging';

@Injectable()
export class SetupOkrBootstrap implements OnModuleInit {
  private readonly logger = new Logger(SetupOkrBootstrap.name);
  constructor(private readonly setupOkrUsecase: SetupOkrUsecase) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.setupOkrUsecase.execute();
    } catch (error) {
      this.logger.error(ErrorLogFormatter.format(error));
    }
  }
}
