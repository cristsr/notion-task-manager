import { ApplicationException } from './application.exception';

export class ExternalServiceException extends ApplicationException {
  readonly code: string = 'EXTERNAL_SERVICE_ERROR';
}
