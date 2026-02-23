import { ApplicationException } from './application.exception';

export class ExternalServiceException extends ApplicationException {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
}
