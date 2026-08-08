import { NotFoundException } from '@shared/domain/exception';
import { ErrorLogFormatter } from './error-log.formatter';

class SampleNotFoundError extends NotFoundException {
  readonly code = 'SAMPLE_NOT_FOUND';

  constructor(context: { id: string }) {
    super(`Sample ${context.id} not found`, { context });
  }
}

describe('ErrorLogFormatter', () => {
  describe('given a BaseException', () => {
    it('delegates to the exception own format', () => {
      const formatted = ErrorLogFormatter.format(new SampleNotFoundError({ id: '42' }));

      expect(formatted).toMatchObject({
        name: 'SampleNotFoundError',
        code: 'SAMPLE_NOT_FOUND',
        message: 'Sample 42 not found',
        context: { id: '42' },
      });
    });
  });

  describe('given a plain Error', () => {
    it('normalizes it as an unexpected error keeping the cause', () => {
      const formatted = ErrorLogFormatter.format(new Error('boom'));

      expect(formatted.code).toBe('UNEXPECTED_ERROR');
      expect(formatted.message).toBe('An unexpected error occurred');
      expect(formatted.cause).toMatchObject({ message: 'boom' });
    });
  });

  describe('given an explicit config', () => {
    it('keeps code, message and context, and flattens the cause', () => {
      const formatted = ErrorLogFormatter.format({
        code: 'QUERY_FAILED',
        message: 'Failed to query',
        context: { cursor: 'abc' },
        cause: new Error('timeout'),
      });

      expect(formatted).toMatchObject({
        code: 'QUERY_FAILED',
        message: 'Failed to query',
        context: { cursor: 'abc' },
        cause: { message: 'timeout' },
      });
    });

    it('omits the cause when there is none', () => {
      const formatted = ErrorLogFormatter.format({ code: 'X', message: 'y' });

      expect(formatted.cause).toBeUndefined();
    });
  });
});
