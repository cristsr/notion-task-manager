import { BaseException } from '@shared/domain/exception';
import { ObjectLiteral } from '@shared/domain/types';

export abstract class ApplicationException extends BaseException {
  format(): ObjectLiteral {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
      cause: this.cause && {
        message: this.cause?.message,
        stack: this.cause?.stack,
      },
    };
  }
}
