export abstract class EventEmitter {
  abstract emit<T>(event: string | symbol, ...values: T[]): boolean;
  abstract emitAsync<T>(event: string | symbol, ...values: T[]): Promise<T[]>;
}
