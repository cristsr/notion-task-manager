import { NotifierPort } from '../../../application/ports';

export class NotifierFactory {
  static createNotifiers() {
    return (...providers: NotifierPort[]) => {
      return new Map<string, NotifierPort>(
        providers.map((p) => [p.instance, p]),
      );
    };
  }
}
