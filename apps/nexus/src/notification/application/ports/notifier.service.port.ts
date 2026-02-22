import { NotifierTypes } from '../types';
import { Notification } from '../../domain';

export const NOTIFIERS = 'NOTIFIERS';

export abstract class NotifierPort {
  abstract readonly instance: NotifierTypes;
  abstract notify(payload: Notification): Promise<void> | void;
}
