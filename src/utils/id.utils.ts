/**
 * Generate a unique ID using timestamp and random string
 * Format: {timestamp}-{random}
 * Example: 1738267890123-a1b2c3d
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};
