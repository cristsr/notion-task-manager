import { Injectable, Logger } from '@nestjs/common';
import { KeyResultRepository } from '@okr/domain';
import { KeyResultProviderPort } from '@okr/application/ports';

@Injectable()
export class SetupOkrUsecase {
  private readonly logger = new Logger(SetupOkrUsecase.name);

  constructor(
    private readonly keyResultRepository: KeyResultRepository,
    private readonly keyResultProvider: KeyResultProviderPort,
  ) {}

  async execute(): Promise<void> {
    this.logger.log('Starting OKR setup - syncing Key Results from Notion');

    const keyResults = await this.keyResultProvider.fetchAll();

    this.logger.log('Fetched Key Results from Notion', {
      count: keyResults.length,
    });

    await this.keyResultRepository.saveMany(keyResults);

    this.logger.log('OKR setup completed - Key Results synced to cache');
  }
}
