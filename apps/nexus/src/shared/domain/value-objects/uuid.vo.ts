import { validate } from 'uuid';
import { Nullable } from '@shared/domain/types';
import { InvalidUuidError } from '@shared/domain/exception';

export class Uuid {
  private constructor(public readonly value: string) {}

  static create(value: string): Uuid {
    if (!validate(value)) {
      throw new InvalidUuidError({ value });
    }

    return new Uuid(value);
  }

  static createOrNull(value: Nullable<string>): Nullable<Uuid> {
    return value ? Uuid.create(value) : null;
  }

  static generate(): Uuid {
    return new Uuid(crypto.randomUUID());
  }

  equals(other: Nullable<Uuid>): boolean {
    return this.value === other?.value;
  }
}
