import {
  getAssetCurrentValue,
  updateAssetValue,
  getCompleteValueHistory,
  calculateAssetValueGrowth,
} from './asset.utils';
import type { ManualAsset } from '../types/models';
import { AssetType, CurrencyCode } from '../types/enums';

describe('asset.utils', () => {
  describe('getAssetCurrentValue', () => {
    it('should return 0 for empty value history', () => {
      const asset = { valueHistory: [] };
      expect(getAssetCurrentValue(asset)).toBe(0);
    });

    it('should return 0 for undefined value history', () => {
      const asset = { valueHistory: undefined as any };
      expect(getAssetCurrentValue(asset)).toBe(0);
    });

    it('should return the latest value from value history', () => {
      const asset = {
        valueHistory: [
          { date: '2024-01-01', value: 1000 },
          { date: '2024-03-01', value: 1500 },
          { date: '2024-02-01', value: 1200 },
        ],
      };
      expect(getAssetCurrentValue(asset)).toBe(1500);
    });

    it('should return the only value when there is one entry', () => {
      const asset = {
        valueHistory: [{ date: '2024-01-01', value: 2500 }],
      };
      expect(getAssetCurrentValue(asset)).toBe(2500);
    });
  });

  describe('updateAssetValue', () => {
    const baseAsset: ManualAsset = {
      id: 'asset-1',
      name: 'Test Asset',
      type: AssetType.REAL_ESTATE,
      valueHistory: [
        { date: '2024-01-01', value: 1000 },
        { date: '2024-02-01', value: 1200 },
      ],
      currencyCode: CurrencyCode.USD,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
    };

    it('should add new value entry to history', () => {
      const result = updateAssetValue(baseAsset, 1500, '2024-03-01');

      expect(result.valueHistory).toHaveLength(3);
      expect(result.valueHistory[2]).toEqual({
        date: '2024-03-01',
        value: 1500,
        notes: undefined,
      });
    });

    it('should add value entry with notes', () => {
      const result = updateAssetValue(baseAsset, 1500, '2024-03-01', 'Annual appreciation');

      expect(result.valueHistory[2]).toEqual({
        date: '2024-03-01',
        value: 1500,
        notes: 'Annual appreciation',
      });
    });

    it('should sort value history chronologically', () => {
      const result = updateAssetValue(baseAsset, 1100, '2024-01-15');

      expect(result.valueHistory).toHaveLength(3);
      expect(result.valueHistory[0].date).toBe('2024-01-01');
      expect(result.valueHistory[1].date).toBe('2024-01-15');
      expect(result.valueHistory[2].date).toBe('2024-02-01');
    });

    it('should update updatedAt timestamp', () => {
      const before = new Date().toISOString();
      const result = updateAssetValue(baseAsset, 1500, '2024-03-01');
      const after = new Date().toISOString();

      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt >= before).toBe(true);
      expect(result.updatedAt <= after).toBe(true);
    });

    it('should preserve other asset properties', () => {
      const result = updateAssetValue(baseAsset, 1500, '2024-03-01');

      expect(result.id).toBe(baseAsset.id);
      expect(result.name).toBe(baseAsset.name);
      expect(result.type).toBe(baseAsset.type);
      expect(result.currencyCode).toBe(baseAsset.currencyCode);
    });
  });

  describe('getCompleteValueHistory', () => {
    const asset: ManualAsset = {
      id: 'asset-1',
      name: 'Test Asset',
      type: AssetType.REAL_ESTATE,
      valueHistory: [
        { date: '2024-03-01', value: 1500 },
        { date: '2024-01-01', value: 1000 },
        { date: '2024-02-01', value: 1200 },
      ],
      currencyCode: CurrencyCode.USD,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
    };

    it('should return value history sorted chronologically', () => {
      const result = getCompleteValueHistory(asset);

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2024-01-01');
      expect(result[1].date).toBe('2024-02-01');
      expect(result[2].date).toBe('2024-03-01');
    });

    it('should return a new array (not mutate original)', () => {
      const result = getCompleteValueHistory(asset);

      expect(result).not.toBe(asset.valueHistory);
      expect(asset.valueHistory[0].date).toBe('2024-03-01'); // Original unchanged
    });
  });

  describe('calculateAssetValueGrowth', () => {
    const asset: ManualAsset = {
      id: 'asset-1',
      name: 'Test Asset',
      type: AssetType.REAL_ESTATE,
      valueHistory: [
        { date: '2024-01-01', value: 1000 },
        { date: '2024-02-01', value: 1200 },
        { date: '2024-03-01', value: 1500 },
        { date: '2024-04-01', value: 1400 },
      ],
      currencyCode: CurrencyCode.USD,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-04-01T00:00:00Z',
    };

    it('should calculate growth from first to last value when no dates provided', () => {
      const result = calculateAssetValueGrowth(asset);

      expect(result.startValue).toBe(1000);
      expect(result.endValue).toBe(1400);
      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-04-01');
      expect(result.absoluteChange).toBe(400);
      expect(result.percentageChange).toBe(40);
    });

    it('should calculate growth for specific start date', () => {
      const result = calculateAssetValueGrowth(asset, '2024-02-01');

      expect(result.startValue).toBe(1200);
      expect(result.endValue).toBe(1400);
      expect(result.startDate).toBe('2024-02-01');
      expect(result.absoluteChange).toBe(200);
      expect(result.percentageChange).toBeCloseTo(16.67, 1);
    });

    it('should calculate growth for specific end date', () => {
      const result = calculateAssetValueGrowth(asset, undefined, '2024-03-01');

      expect(result.startValue).toBe(1000);
      expect(result.endValue).toBe(1500);
      expect(result.endDate).toBe('2024-03-01');
      expect(result.absoluteChange).toBe(500);
      expect(result.percentageChange).toBe(50);
    });

    it('should calculate growth for specific date range', () => {
      const result = calculateAssetValueGrowth(asset, '2024-02-01', '2024-03-01');

      expect(result.startValue).toBe(1200);
      expect(result.endValue).toBe(1500);
      expect(result.absoluteChange).toBe(300);
      expect(result.percentageChange).toBe(25);
    });

    it('should handle negative growth', () => {
      const result = calculateAssetValueGrowth(asset, '2024-03-01', '2024-04-01');

      expect(result.startValue).toBe(1500);
      expect(result.endValue).toBe(1400);
      expect(result.absoluteChange).toBe(-100);
      expect(result.percentageChange).toBeCloseTo(-6.67, 1);
    });

    it('should handle zero start value', () => {
      const zeroAsset: ManualAsset = {
        ...asset,
        valueHistory: [
          { date: '2024-01-01', value: 0 },
          { date: '2024-02-01', value: 1000 },
        ],
      };

      const result = calculateAssetValueGrowth(zeroAsset);

      expect(result.percentageChange).toBe(0);
    });

    it('should use closest entry on or after start date', () => {
      const result = calculateAssetValueGrowth(asset, '2024-01-15');

      expect(result.startDate).toBe('2024-02-01'); // First entry on or after 2024-01-15
      expect(result.startValue).toBe(1200);
    });

    it('should use closest entry on or before end date', () => {
      const result = calculateAssetValueGrowth(asset, undefined, '2024-03-15');

      expect(result.endDate).toBe('2024-03-01'); // Last entry on or before 2024-03-15
      expect(result.endValue).toBe(1500);
    });

    it('should throw error if less than 2 values', () => {
      const singleValueAsset: ManualAsset = {
        ...asset,
        valueHistory: [{ date: '2024-01-01', value: 1000 }],
      };

      expect(() => calculateAssetValueGrowth(singleValueAsset)).toThrow(
        'Insufficient data to calculate growth. At least 2 values are required.'
      );
    });

    it('should throw error for empty value history', () => {
      const emptyAsset: ManualAsset = {
        ...asset,
        valueHistory: [],
      };

      expect(() => calculateAssetValueGrowth(emptyAsset)).toThrow(
        'Insufficient data to calculate growth. At least 2 values are required.'
      );
    });

    it('should use first entry when start date is before all entries', () => {
      const result = calculateAssetValueGrowth(asset, '2023-12-01');

      expect(result.startDate).toBe('2024-01-01');
      expect(result.startValue).toBe(1000);
    });

    it('should use last entry when end date is after all entries', () => {
      const result = calculateAssetValueGrowth(asset, undefined, '2024-12-31');

      expect(result.endDate).toBe('2024-04-01');
      expect(result.endValue).toBe(1400);
    });
  });
});
