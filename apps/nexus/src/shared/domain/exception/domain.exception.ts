import { BaseException } from './base.exception';
import { ObjectLiteral } from '@shared/domain/types';

export abstract class DomainException extends BaseException {
  format(): ObjectLiteral {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
    };
  }
}
