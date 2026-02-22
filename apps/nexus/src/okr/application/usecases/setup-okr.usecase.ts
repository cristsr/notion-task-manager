import { Injectable, Logger } from '@nestjs/common';
import { KeyResultRepository, KeyResultSourcePort } from '@okr/domain';

@Injectable()
export class SetupOkrUsecase {
  private readonly logger = new Logger(SetupOkrUsecase.name);

  constructor(
    private readonly keyResultRepository: KeyResultRepository,
    private readonly keyResultSource: KeyResultSourcePort,
  ) {}

  async execute(): Promise<void> {
    try {
      const keyResults = await this.keyResultSource.fetchAll();
      await this.keyResultRepository.saveMany(keyResults);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
