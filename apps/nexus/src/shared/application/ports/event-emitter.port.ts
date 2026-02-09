export abstract class EventEmitterPort {
  abstract emit(event: string | symbol, ...values: any[]): boolean;
  abstract emitAsync(event: string | symbol, ...values: any[]): Promise<any[]>;
}
