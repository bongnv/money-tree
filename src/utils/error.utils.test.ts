import { isUserCancellationError } from './error.utils';

describe('error.utils', () => {
  describe('isUserCancellationError', () => {
    it('should return true for error with user_cancelled in message', () => {
      const error = new Error('user_cancelled: User cancelled the flow.');
      expect(isUserCancellationError(error)).toBe(true);
    });

    it('should return true for error with just user_cancelled', () => {
      const error = new Error('user_cancelled');
      expect(isUserCancellationError(error)).toBe(true);
    });

    it('should return false for error without user_cancelled', () => {
      const error = new Error('Something went wrong');
      expect(isUserCancellationError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isUserCancellationError('string error')).toBe(false);
      expect(isUserCancellationError(null)).toBe(false);
      expect(isUserCancellationError(undefined)).toBe(false);
      expect(isUserCancellationError({})).toBe(false);
    });

    it('should return false for Error without message', () => {
      const error = new Error();
      expect(isUserCancellationError(error)).toBe(false);
    });
  });
});
