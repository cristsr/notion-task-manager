import { validate } from 'uuid';

export class Uuid {
  private constructor(public readonly value: string) {}

  static create(value: string): Uuid {
    if (!validate(value)) {
      throw new Error('Invalid UUID');
    }

    return new Uuid(value);
  }

  static generate(): Uuid {
    return new Uuid(crypto.randomUUID());
  }

  equals(other: Uuid): boolean {
    return this.value === other.value;
  }
}
