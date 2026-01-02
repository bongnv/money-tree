import { updateAssetValue } from './history.service';
import type { ManualAsset } from '../types/models';
import { AssetType } from '../types/enums';

describe('history.service', () => {
  describe('updateAssetValue', () => {
    const baseAsset: ManualAsset = {
      id: 'asset-1',
      name: 'Test House',
      type: AssetType.REAL_ESTATE,
      value: 500000,
      currencyId: 'usd',
      date: '2026-01-01',
      notes: 'Initial purchase',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    it('should move current value to history and set new value', () => {
      const result = updateAssetValue(baseAsset, 510000, '2026-04-01', 'Market appraisal');

      expect(result.value).toBe(510000);
      expect(result.date).toBe('2026-04-01');
      expect(result.notes).toBe('Market appraisal');
      expect(result.valueHistory).toHaveLength(1);
      expect(result.valueHistory![0]).toEqual({
        date: '2026-01-01',
        value: 500000,
        notes: 'Initial purchase',
      });
    });

    it('should add to existing history and maintain chronological order', () => {
      const assetWithHistory: ManualAsset = {
        ...baseAsset,
        value: 510000,
        date: '2026-04-01',
        valueHistory: [
          { date: '2026-01-01', value: 500000, notes: 'Initial purchase' },
        ],
      };

      const result = updateAssetValue(assetWithHistory, 520000, '2026-07-01', 'New appraisal');

      expect(result.value).toBe(520000);
      expect(result.date).toBe('2026-07-01');
      expect(result.valueHistory).toHaveLength(2);
      expect(result.valueHistory![0].date).toBe('2026-01-01');
      expect(result.valueHistory![1].date).toBe('2026-04-01');
    });

    it('should handle assets without notes', () => {
      const assetWithoutNotes: ManualAsset = {
        ...baseAsset,
        notes: undefined,
      };

      const result = updateAssetValue(assetWithoutNotes, 510000, '2026-04-01');

      expect(result.valueHistory![0].notes).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('should handle negative values (liabilities)', () => {
      const liability: ManualAsset = {
        ...baseAsset,
        type: AssetType.LIABILITY,
        value: -50000,
        notes: 'Initial loan',
      };

      const result = updateAssetValue(liability, -45000, '2026-04-01', 'Payment made');

      expect(result.value).toBe(-45000);
      expect(result.valueHistory![0].value).toBe(-50000);
    });

    it('should update updatedAt timestamp', () => {
      const beforeUpdate = Date.now();
      const result = updateAssetValue(baseAsset, 510000, '2026-04-01');
      const afterUpdate = Date.now();

      const updatedAtTime = new Date(result.updatedAt).getTime();
      expect(updatedAtTime).toBeGreaterThanOrEqual(beforeUpdate);
      expect(updatedAtTime).toBeLessThanOrEqual(afterUpdate);
    });

    it('should preserve other asset properties', () => {
      const result = updateAssetValue(baseAsset, 510000, '2026-04-01');

      expect(result.id).toBe(baseAsset.id);
      expect(result.name).toBe(baseAsset.name);
      expect(result.type).toBe(baseAsset.type);
      expect(result.currencyId).toBe(baseAsset.currencyId);
      expect(result.createdAt).toBe(baseAsset.createdAt);
    });

    it('should handle multiple history entries and keep them sorted', () => {
      const assetWithMultipleHistory: ManualAsset = {
        ...baseAsset,
        value: 530000,
        date: '2026-10-01',
        valueHistory: [
          { date: '2026-01-01', value: 500000 },
          { date: '2026-04-01', value: 510000 },
          { date: '2026-07-01', value: 520000 },
        ],
      };

      const result = updateAssetValue(assetWithMultipleHistory, 540000, '2026-12-01');

      expect(result.valueHistory).toHaveLength(4);
      expect(result.valueHistory!.map((h) => h.date)).toEqual([
        '2026-01-01',
        '2026-04-01',
        '2026-07-01',
        '2026-10-01',
      ]);
      expect(result.valueHistory!.map((h) => h.value)).toEqual([
        500000, 510000, 520000, 530000,
      ]);
    });

    it('should handle backdated value correctly', () => {
      const assetWithHistory: ManualAsset = {
        ...baseAsset,
        value: 520000,
        date: '2026-07-01',
        valueHistory: [
          { date: '2026-01-01', value: 500000 },
        ],
      };

      // Update with a date between existing history entries
      const result = updateAssetValue(assetWithHistory, 515000, '2026-09-01');

      expect(result.valueHistory).toHaveLength(2);
      expect(result.valueHistory![0].date).toBe('2026-01-01');
      expect(result.valueHistory![1].date).toBe('2026-07-01');
      expect(result.value).toBe(515000);
      expect(result.date).toBe('2026-09-01');
    });
  });
});
