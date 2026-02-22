import { Uuid } from '@shared/domain/value-objects';
import { PropertiesOnly } from '@shared/domain/types';

export class Objective {
  id: Uuid;

  title: string;

  private constructor(input: PropertiesOnly<Objective>) {
    Object.assign(this, input);
  }

  static create(input: PropertiesOnly<Objective>): Objective {
    return new Objective(input);
  }
}
