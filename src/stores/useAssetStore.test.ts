import { renderHook, act } from '@testing-library/react';
import { useAssetStore } from './useAssetStore';
import { useAppStore } from './useAppStore';
import { AssetType } from '../types/enums';
import type { ManualAsset } from '../types/models';

// Mock useAppStore
jest.mock('./useAppStore', () => ({
  useAppStore: {
    getState: jest.fn(() => ({
      setUnsavedChanges: jest.fn(),
    })),
  },
}));

describe('useAssetStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAssetStore());
    act(() => {
      result.current.resetManualAssets();
    });
    jest.clearAllMocks();
  });

  const mockAsset: ManualAsset = {
    id: 'asset-1',
    name: 'House',
    type: AssetType.REAL_ESTATE,
    currencyCode: 'USD',
    notes: 'Primary residence',
    valueHistory: [
      {
        date: new Date().toISOString().split('T')[0],
        value: 500000,
        notes: 'Initial valuation',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('setManualAssets', () => {
    it('should set manual assets', () => {
      const { result } = renderHook(() => useAssetStore());
      const assets = [mockAsset];

      act(() => {
        result.current.setManualAssets(assets);
      });

      expect(result.current.manualAssets).toEqual(assets);
    });
  });

  describe('addManualAsset', () => {
    it('should add a manual asset', () => {
      const { result } = renderHook(() => useAssetStore());

      act(() => {
        result.current.addManualAsset(mockAsset);
      });

      expect(result.current.manualAssets).toHaveLength(1);
      expect(result.current.manualAssets[0]).toEqual(mockAsset);
    });

    it('should mark unsaved changes', () => {
      const { result } = renderHook(() => useAssetStore());
      const setUnsavedChanges = jest.fn();
      (useAppStore.getState as jest.Mock).mockReturnValue({ setUnsavedChanges });

      act(() => {
        result.current.addManualAsset(mockAsset);
      });

      expect(setUnsavedChanges).toHaveBeenCalledWith(true);
    });
  });

  describe('updateManualAsset', () => {
    it('should update an existing manual asset', () => {
      const { result } = renderHook(() => useAssetStore());

      act(() => {
        result.current.addManualAsset(mockAsset);
      });

      const updates = { name: 'Updated House', value: 600000 };

      act(() => {
        result.current.updateManualAsset('asset-1', updates);
      });

      expect(result.current.manualAssets[0].name).toBe('Updated House');
      expect(result.current.manualAssets[0].value).toBe(600000);
    });

    it('should update the updatedAt timestamp', () => {
      const { result } = renderHook(() => useAssetStore());

      act(() => {
        result.current.addManualAsset(mockAsset);
      });

      const originalUpdatedAt = result.current.manualAssets[0].updatedAt;

      act(() => {
        result.current.updateManualAsset('asset-1', { name: 'Updated House' });
      });

      expect(result.current.manualAssets[0].updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should mark unsaved changes', () => {
      const { result } = renderHook(() => useAssetStore());
      const setUnsavedChanges = jest.fn();
      (useAppStore.getState as jest.Mock).mockReturnValue({ setUnsavedChanges });

      act(() => {
        result.current.addManualAsset(mockAsset);
      });

      jest.clearAllMocks();

      act(() => {
        result.current.updateManualAsset('asset-1', { name: 'Updated House' });
      });

      expect(setUnsavedChanges).toHaveBeenCalledWith(true);
    });
  });

  describe('deleteManualAsset', () => {
    it('should delete a manual asset', () => {
      const { result } = renderHook(() => useAssetStore());

      act(() => {
        result.current.addManualAsset(mockAsset);
      });

      expect(result.current.manualAssets).toHaveLength(1);

      act(() => {
        result.current.deleteManualAsset('asset-1');
      });

      expect(result.current.manualAssets).toHaveLength(0);
    });

    it('should mark unsaved changes', () => {
      const { result } = renderHook(() => useAssetStore());
      const setUnsavedChanges = jest.fn();
      (useAppStore.getState as jest.Mock).mockReturnValue({ setUnsavedChanges });

      act(() => {
        result.current.addManualAsset(mockAsset);
      });

      jest.clearAllMocks();

      act(() => {
        result.current.deleteManualAsset('asset-1');
      });

      expect(setUnsavedChanges).toHaveBeenCalledWith(true);
    });
  });

  describe('getManualAssetById', () => {
    it('should return asset by id', () => {
      const { result } = renderHook(() => useAssetStore());

      act(() => {
        result.current.addManualAsset(mockAsset);
      });

      const asset = result.current.getManualAssetById('asset-1');
      expect(asset).toEqual(mockAsset);
    });

    it('should return undefined for non-existent id', () => {
      const { result } = renderHook(() => useAssetStore());

      const asset = result.current.getManualAssetById('non-existent');
      expect(asset).toBeUndefined();
    });
  });

  describe('getManualAssetsByType', () => {
    it('should return assets filtered by type', () => {
      const { result } = renderHook(() => useAssetStore());

      const vehicle: ManualAsset = {
        ...mockAsset,
        id: 'asset-2',
        name: 'Car',
        type: AssetType.OTHER,
        value: 25000,
      };

      act(() => {
        result.current.addManualAsset(mockAsset);
        result.current.addManualAsset(vehicle);
      });

      const realEstateAssets = result.current.getManualAssetsByType(AssetType.REAL_ESTATE);
      expect(realEstateAssets).toHaveLength(1);
      expect(realEstateAssets[0].id).toBe('asset-1');

      const otherAssets = result.current.getManualAssetsByType(AssetType.OTHER);
      expect(otherAssets).toHaveLength(1);
      expect(otherAssets[0].id).toBe('asset-2');
    });

    it('should return empty array if no assets match', () => {
      const { result } = renderHook(() => useAssetStore());

      act(() => {
        result.current.addManualAsset(mockAsset);
      });

      const vehicles = result.current.getManualAssetsByType(AssetType.OTHER);
      expect(vehicles).toHaveLength(0);
    });
  });

  describe('resetManualAssets', () => {
    it('should clear all manual assets', () => {
      const { result } = renderHook(() => useAssetStore());

      act(() => {
        result.current.addManualAsset(mockAsset);
      });

      expect(result.current.manualAssets).toHaveLength(1);

      act(() => {
        result.current.resetManualAssets();
      });

      expect(result.current.manualAssets).toHaveLength(0);
    });
  });

  describe('updateAssetValue', () => {
    it('should add new value entry to history', () => {
      const { result } = renderHook(() => useAssetStore());

      act(() => {
        result.current.addManualAsset(mockAsset);
      });

      act(() => {
        result.current.updateAssetValue('asset-1', 510000, '2026-04-01', 'Market appraisal');
      });

      const updatedAsset = result.current.manualAssets[0];
      expect(updatedAsset.valueHistory).toHaveLength(2);
      // Should have original value and new value
      expect(updatedAsset.valueHistory.some((v) => v.value === 500000)).toBe(true);
      expect(updatedAsset.valueHistory.some((v) => v.value === 510000)).toBe(true);
      // The latest entry should be the new value
      const sorted = [...updatedAsset.valueHistory].sort((a, b) => b.date.localeCompare(a.date));
      expect(sorted[0].value).toBe(510000);
      expect(sorted[0].date).toBe('2026-04-01');
      expect(sorted[0].notes).toBe('Market appraisal');
    });

    it('should add to existing history when updating value', () => {
      const { result } = renderHook(() => useAssetStore());
      const assetWithHistory: ManualAsset = {
        ...mockAsset,
        valueHistory: [
          { date: '2025-01-01', value: 450000, notes: 'Initial' },
          { date: '2025-06-01', value: 500000, notes: 'Current' },
        ],
      };

      act(() => {
        result.current.addManualAsset(assetWithHistory);
      });

      act(() => {
        result.current.updateAssetValue('asset-1', 510000, '2026-04-01');
      });

      const updatedAsset = result.current.manualAssets[0];
      expect(updatedAsset.valueHistory).toHaveLength(3);
      expect(updatedAsset.valueHistory.some((v) => v.value === 450000)).toBe(true);
      expect(updatedAsset.valueHistory.some((v) => v.value === 500000)).toBe(true);
      expect(updatedAsset.valueHistory.some((v) => v.value === 510000)).toBe(true);
    });

    it('should mark unsaved changes', () => {
      const { result } = renderHook(() => useAssetStore());
      const setUnsavedChanges = jest.fn();
      (useAppStore.getState as jest.Mock).mockReturnValue({ setUnsavedChanges });

      act(() => {
        result.current.addManualAsset(mockAsset);
      });

      jest.clearAllMocks();

      act(() => {
        result.current.updateAssetValue('asset-1', 510000, '2026-04-01');
      });

      expect(setUnsavedChanges).toHaveBeenCalledWith(true);
    });

    it('should not update non-matching assets', () => {
      const { result } = renderHook(() => useAssetStore());
      const asset2: ManualAsset = {
        ...mockAsset,
        id: 'asset-2',
        name: 'Car',
        valueHistory: [{ date: '2026-01-01', value: 30000 }],
      };

      act(() => {
        result.current.addManualAsset(mockAsset);
        result.current.addManualAsset(asset2);
      });

      act(() => {
        result.current.updateAssetValue('asset-1', 510000, '2026-04-01');
      });

      const asset1 = result.current.manualAssets[0];
      const asset2Updated = result.current.manualAssets[1];

      // Asset 1 should have new value
      const asset1Latest = [...asset1.valueHistory].sort((a, b) => b.date.localeCompare(a.date))[0];
      expect(asset1Latest.value).toBe(510000);

      // Asset 2 should be unchanged
      const asset2Latest = [...asset2Updated.valueHistory].sort((a, b) =>
        b.date.localeCompare(a.date)
      )[0];
      expect(asset2Latest.value).toBe(30000);
    });
  });
});
