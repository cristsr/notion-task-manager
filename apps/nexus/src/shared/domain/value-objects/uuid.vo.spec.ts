import { validate } from 'uuid';
import { InvalidUuidError } from '@shared/domain/exception';
import { Uuid } from './uuid.vo';

describe('Uuid', () => {
  const VALID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  const OTHER = '0b8a6501-1c1f-4b8e-8b64-7a1a2f3c4d5e';

  describe('create', () => {
    it('wraps a valid uuid', () => {
      expect(Uuid.create(VALID).value).toBe(VALID);
    });

    it('rejects a malformed value with a typed domain error', () => {
      expect(() => Uuid.create('not-a-uuid')).toThrow(InvalidUuidError);
    });

    it('carries the offending value in the error context', () => {
      try {
        Uuid.create('not-a-uuid');
        fail('expected InvalidUuidError');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidUuidError);
        expect(error.code).toBe('INVALID_UUID');
        expect(error.context).toEqual({ value: 'not-a-uuid' });
      }
    });
  });

  describe('createOrNull', () => {
    it('returns null for an absent value', () => {
      expect(Uuid.createOrNull(null)).toBeNull();
    });

    it('returns a Uuid for a present value', () => {
      expect(Uuid.createOrNull(VALID)?.value).toBe(VALID);
    });

    it('still rejects a present but malformed value', () => {
      expect(() => Uuid.createOrNull('nope')).toThrow(InvalidUuidError);
    });
  });

  describe('generate', () => {
    it('produces a valid uuid', () => {
      expect(validate(Uuid.generate().value)).toBe(true);
    });
  });

  describe('equals', () => {
    it('is true for the same value', () => {
      expect(Uuid.create(VALID).equals(Uuid.create(VALID))).toBe(true);
    });

    it('is false for a different value', () => {
      expect(Uuid.create(VALID).equals(Uuid.create(OTHER))).toBe(false);
    });

    it('is false against null', () => {
      expect(Uuid.create(VALID).equals(null)).toBe(false);
    });
  });
});
