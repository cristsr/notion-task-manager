import { Injectable } from '@nestjs/common';
import { KeyResultRepository, KeyResultDataSourcePort } from '@okr/domain';

@Injectable()
export class SetupOkrUsecase {
  constructor(
    private readonly keyResultRepository: KeyResultRepository,
    private readonly keyResultSource: KeyResultDataSourcePort,
  ) {}

  async execute(): Promise<void> {
    const keyResults = await this.keyResultSource.fetchAll();
    await this.keyResultRepository.saveMany(keyResults);
  }
}
