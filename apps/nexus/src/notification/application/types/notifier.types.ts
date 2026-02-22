import { NotifierPort } from '../ports';

export enum NotifierTypes {
  PUSHOVER = 'PUSHOVER',
  DISCORD = 'DISCORD',
}

export type Notifiers = Map<NotifierTypes, NotifierPort>;
