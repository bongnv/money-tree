import {
  updateAssetValue,
  getCompleteValueHistory,
  calculateAssetValueGrowth,
} from './history.service';
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
        valueHistory: [{ date: '2026-01-01', value: 500000, notes: 'Initial purchase' }],
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
      expect(result.valueHistory!.map((h) => h.value)).toEqual([500000, 510000, 520000, 530000]);
    });

    it('should handle backdated value correctly', () => {
      const assetWithHistory: ManualAsset = {
        ...baseAsset,
        value: 520000,
        date: '2026-07-01',
        valueHistory: [{ date: '2026-01-01', value: 500000 }],
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

  describe('getCompleteValueHistory', () => {
    it('should return history plus current value, sorted chronologically', () => {
      const asset: ManualAsset = {
        id: 'asset-1',
        name: 'Test Asset',
        type: AssetType.OTHER,
        value: 15000,
        currencyId: 'usd',
        date: '2026-07-01',
        valueHistory: [
          { date: '2026-01-01', value: 10000 },
          { date: '2026-04-01', value: 12000 },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      };

      const result = getCompleteValueHistory(asset);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ date: '2026-01-01', value: 10000 });
      expect(result[1]).toEqual({ date: '2026-04-01', value: 12000 });
      expect(result[2]).toEqual({ date: '2026-07-01', value: 15000 });
    });

    it('should return only current value if no history exists', () => {
      const asset: ManualAsset = {
        id: 'asset-1',
        name: 'Test Asset',
        type: AssetType.OTHER,
        value: 10000,
        currencyId: 'usd',
        date: '2026-01-01',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const result = getCompleteValueHistory(asset);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ date: '2026-01-01', value: 10000 });
    });

    it('should include notes from current value', () => {
      const asset: ManualAsset = {
        id: 'asset-1',
        name: 'Test Asset',
        type: AssetType.OTHER,
        value: 10000,
        currencyId: 'usd',
        date: '2026-01-01',
        notes: 'Current notes',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const result = getCompleteValueHistory(asset);

      expect(result[0].notes).toBe('Current notes');
    });
  });

  describe('calculateAssetValueGrowth', () => {
    it('should calculate growth between first and current value', () => {
      const asset: ManualAsset = {
        id: 'asset-1',
        name: 'Test Asset',
        type: AssetType.OTHER,
        value: 15000,
        currencyId: 'usd',
        date: '2026-07-01',
        valueHistory: [{ date: '2026-01-01', value: 10000 }],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      };

      const result = calculateAssetValueGrowth(asset);

      expect(result.startDate).toBe('2026-01-01');
      expect(result.endDate).toBe('2026-07-01');
      expect(result.startValue).toBe(10000);
      expect(result.endValue).toBe(15000);
      expect(result.absoluteChange).toBe(5000);
      expect(result.percentageChange).toBeCloseTo(50, 1);
    });

    it('should calculate negative growth', () => {
      const asset: ManualAsset = {
        id: 'asset-1',
        name: 'Test Asset',
        type: AssetType.OTHER,
        value: 8000,
        currencyId: 'usd',
        date: '2026-07-01',
        valueHistory: [{ date: '2026-01-01', value: 10000 }],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      };

      const result = calculateAssetValueGrowth(asset);

      expect(result.absoluteChange).toBe(-2000);
      expect(result.percentageChange).toBeCloseTo(-20, 1);
    });

    it('should filter by start date', () => {
      const asset: ManualAsset = {
        id: 'asset-1',
        name: 'Test Asset',
        type: AssetType.OTHER,
        value: 15000,
        currencyId: 'usd',
        date: '2026-07-01',
        valueHistory: [
          { date: '2026-01-01', value: 8000 },
          { date: '2026-04-01', value: 12000 },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      };

      const result = calculateAssetValueGrowth(asset, '2026-03-01');

      expect(result.startDate).toBe('2026-04-01');
      expect(result.startValue).toBe(12000);
      expect(result.endValue).toBe(15000);
      expect(result.absoluteChange).toBe(3000);
    });

    it('should filter by end date', () => {
      const asset: ManualAsset = {
        id: 'asset-1',
        name: 'Test Asset',
        type: AssetType.OTHER,
        value: 15000,
        currencyId: 'usd',
        date: '2026-07-01',
        valueHistory: [
          { date: '2026-01-01', value: 10000 },
          { date: '2026-04-01', value: 12000 },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      };

      const result = calculateAssetValueGrowth(asset, undefined, '2026-05-01');

      expect(result.startDate).toBe('2026-01-01');
      expect(result.endDate).toBe('2026-04-01');
      expect(result.endValue).toBe(12000);
      expect(result.absoluteChange).toBe(2000);
    });

    it('should filter by both start and end date', () => {
      const asset: ManualAsset = {
        id: 'asset-1',
        name: 'Test Asset',
        type: AssetType.OTHER,
        value: 15000,
        currencyId: 'usd',
        date: '2026-07-01',
        valueHistory: [
          { date: '2026-01-01', value: 8000 },
          { date: '2026-04-01', value: 12000 },
          { date: '2026-05-01', value: 13000 },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      };

      const result = calculateAssetValueGrowth(asset, '2026-03-01', '2026-06-01');

      expect(result.startDate).toBe('2026-04-01');
      expect(result.endDate).toBe('2026-05-01');
      expect(result.startValue).toBe(12000);
      expect(result.endValue).toBe(13000);
    });

    it('should throw error if insufficient data', () => {
      const asset: ManualAsset = {
        id: 'asset-1',
        name: 'Test Asset',
        type: AssetType.OTHER,
        value: 10000,
        currencyId: 'usd',
        date: '2026-01-01',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      expect(() => calculateAssetValueGrowth(asset)).toThrow(
        'Insufficient data to calculate growth'
      );
    });
  });
});
