import { BaseException } from '@shared/domain/exception';

export interface ErrorLogConfig {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  cause?: Error;
}

export class ErrorLogFormatter {
  static format(error: Error): Record<string, unknown>;
  static format(config: ErrorLogConfig): Record<string, unknown>;
  static format(errorOrConfig: Error | ErrorLogConfig): Record<string, unknown> {
    if (errorOrConfig instanceof Error) {
      if (errorOrConfig instanceof BaseException) {
        return errorOrConfig.format();
      }

      return {
        code: 'UNEXPECTED_ERROR',
        message: 'An unexpected error occurred',
        cause: {
          message: errorOrConfig.message,
          stack: errorOrConfig.stack,
        },
      };
    }

    return {
      code: errorOrConfig.code,
      message: errorOrConfig.message,
      context: errorOrConfig.context,
      cause: errorOrConfig.cause && {
        message: errorOrConfig.cause.message,
        stack: errorOrConfig.cause.stack,
      },
    };
  }
}
