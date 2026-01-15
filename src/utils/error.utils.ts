/**
 * Utility functions for error handling
 */

/**
 * Checks if an error is a user cancellation error (e.g., from file picker or auth dialog)
 * @param error - The error to check
 * @returns true if the error is a user cancellation, false otherwise
 */
export const isUserCancellationError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message?.includes('user_cancelled') ?? false;
  }
  return false;
};
