import { Injectable, OnModuleInit } from '@nestjs/common';
import { SetupOkrUsecase } from '@okr/application/usecases';

@Injectable()
export class SetupOkrService implements OnModuleInit {
  constructor(private readonly setupOkrUsecase: SetupOkrUsecase) {}

  async onModuleInit(): Promise<void> {
    await this.setupOkrUsecase.execute();
  }
}
