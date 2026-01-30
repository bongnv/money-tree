import { generateId } from './id.utils';

describe('id.utils', () => {
  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate ID with timestamp-random format', () => {
      const id = generateId();

      // Format: {timestamp}-{random}
      const parts = id.split('-');
      expect(parts.length).toBe(2);

      // First part should be a valid timestamp (number)
      const timestamp = parseInt(parts[0], 10);
      expect(timestamp).toBeGreaterThan(0);
      expect(timestamp).toBeLessThanOrEqual(Date.now());

      // Second part should be a random string
      expect(parts[1]).toMatch(/^[0-9a-z]+$/);
      expect(parts[1].length).toBeGreaterThan(0);
    });

    it('should generate different IDs on consecutive calls', () => {
      const ids = new Set();

      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }

      expect(ids.size).toBe(100);
    });
  });
});
