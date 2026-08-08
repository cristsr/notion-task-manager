import { NotifierPort } from '@notification/application/ports';
import { Notifiers } from '@notification/application/types';

export class NotifierFactory {
  static createNotifiers() {
    return (...providers: NotifierPort[]): Notifiers => {
      return new Map(providers.map((provider) => [provider.instance, provider]));
    };
  }
}
