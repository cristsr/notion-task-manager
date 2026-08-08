import { NotifierTypes } from '../types';

/**
 * Deployment-level defaults applied when a notification does not specify them.
 * Resolved from configuration by the infrastructure layer.
 */
export abstract class NotificationDefaults {
  abstract readonly provider: NotifierTypes;
  abstract readonly ttl: number;
}
