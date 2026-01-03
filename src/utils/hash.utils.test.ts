import { calculateMD5Hash, calculateDataFileHash } from './hash.utils';

describe('hash.utils', () => {
  describe('calculateMD5Hash', () => {
    it('should generate consistent hash for same content', async () => {
      const content = 'test content';
      const hash1 = await calculateMD5Hash(content);
      const hash2 = await calculateMD5Hash(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should generate different hashes for different content', async () => {
      const hash1 = await calculateMD5Hash('content1');
      const hash2 = await calculateMD5Hash('content2');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', async () => {
      const hash = await calculateMD5Hash('');

      expect(hash).toHaveLength(64);
      expect(hash).toBeTruthy();
    });

    it('should handle unicode characters', async () => {
      const content = '测试内容 🎉 العربية';
      const hash = await calculateMD5Hash(content);

      expect(hash).toHaveLength(64);
      expect(hash).toBeTruthy();
    });
  });

  describe('calculateDataFileHash', () => {
    it('should generate consistent hash for same object', async () => {
      const data = {
        accounts: [{ id: '1', name: 'Test' }],
        transactions: [],
      };

      const hash1 = await calculateDataFileHash(data);
      const hash2 = await calculateDataFileHash(data);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different objects', async () => {
      const data1 = { accounts: [{ id: '1', name: 'Test1' }] };
      const data2 = { accounts: [{ id: '1', name: 'Test2' }] };

      const hash1 = await calculateDataFileHash(data1);
      const hash2 = await calculateDataFileHash(data2);

      expect(hash1).not.toBe(hash2);
    });

    it('should be sensitive to property order (JSON.stringify behavior)', async () => {
      // Note: This test documents JSON.stringify behavior
      // In practice, we control the order by using the same DataFile structure
      const data1 = { a: 1, b: 2 };
      const data2 = { b: 2, a: 1 };

      const hash1 = await calculateDataFileHash(data1);
      const hash2 = await calculateDataFileHash(data2);

      // Property order matters in JSON.stringify
      expect(hash1).not.toBe(hash2);
    });
  });
});
