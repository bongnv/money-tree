/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { AssetType, CurrencyCode } from '@/types/enums';
import type { ManualAsset } from '@/types/models';
import { useAssetForm } from './useAssetForm';

describe('useAssetForm', () => {
  const mockAsset: ManualAsset = {
    id: 'asset-1',
    name: 'Test Asset',
    type: AssetType.REAL_ESTATE,
    currencyCode: CurrencyCode.USD,
    notes: 'Test notes',
    valueHistory: [
      {
        date: '2024-01-01',
        value: 100000,
        notes: 'Initial value',
      },
    ],
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('initialization - create mode', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAssetForm());

      expect(result.current.formData).toMatchObject({
        name: '',
        type: AssetType.OTHER,
        currencyCode: CurrencyCode.USD,
        value: '0',
      });
      expect(result.current.formData.date).toBeDefined();
      expect(result.current.errors).toEqual({});
    });
  });

  describe('initialization - edit mode', () => {
    it('should initialize with asset values', () => {
      const { result } = renderHook(() => useAssetForm({ asset: mockAsset, mode: 'edit' }));

      expect(result.current.formData).toMatchObject({
        name: 'Test Asset',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        value: '100000',
        date: '2024-01-01',
        notes: 'Initial value',
      });
    });
  });

  describe('initialization - update-value mode', () => {
    it('should initialize with empty value update form', () => {
      const { result } = renderHook(() => useAssetForm({ asset: mockAsset, mode: 'update-value' }));

      expect(result.current.formData).toMatchObject({
        value: '',
        note: '',
      });
      expect(result.current.formData.date).toBeDefined();
    });
  });

  describe('setField', () => {
    it('should update field value', async () => {
      const { result } = renderHook(() => useAssetForm());

      await act(async () => {
        result.current.setField('name' as any, 'New Asset');
      });

      expect((result.current.formData as any).name).toBe('New Asset');
    });

    it('should update multiple fields independently', async () => {
      const { result } = renderHook(() => useAssetForm());

      await act(async () => {
        result.current.setField('name' as any, 'New Asset');
      });

      await act(async () => {
        result.current.setField('type' as any, AssetType.STOCKS_AND_SHARES);
      });

      await act(async () => {
        result.current.setField('currencyCode' as any, CurrencyCode.AUD);
      });

      const formData = result.current.formData as any;
      expect(formData.name).toBe('New Asset');
      expect(formData.type).toBe(AssetType.STOCKS_AND_SHARES);
      expect(formData.currencyCode).toBe(CurrencyCode.AUD);
    });

    it('should clear field error when field is updated', async () => {
      const { result } = renderHook(() => useAssetForm());

      // Trigger validation error by submitting empty form
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.name).toBeDefined();

      // Update the field
      await act(async () => {
        result.current.setField('name' as any, 'Valid Name');
      });

      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('handleSubmit - create mode', () => {
    it('should validate form before submit', async () => {
      const mockSubmit = jest.fn();
      const { result } = renderHook(() => useAssetForm({ onSubmit: mockSubmit }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.name).toBeDefined();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('should call onSubmit with valid data', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAssetForm({ onSubmit: mockSubmit }));

      await act(async () => {
        result.current.setField('name' as any, 'Test Asset');
      });

      await act(async () => {
        result.current.setField('value', '50000');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockSubmit).toHaveBeenCalled();
      expect(result.current.errors).toEqual({});
    });

    it('should handle submit without onSubmit callback', async () => {
      const { result } = renderHook(() => useAssetForm());

      await act(async () => {
        result.current.setField('name' as any, 'Test Asset');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Should not throw error
      expect(result.current.errors).toEqual({});
    });

    it('should validate value as number', async () => {
      const mockSubmit = jest.fn();
      const { result } = renderHook(() => useAssetForm({ onSubmit: mockSubmit }));

      await act(async () => {
        result.current.setField('name' as any, 'Test Asset');
      });

      await act(async () => {
        result.current.setField('value', 'invalid');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.value).toBeDefined();
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('handleSubmit - update-value mode', () => {
    it('should validate value update form', async () => {
      const mockSubmit = jest.fn();
      const { result } = renderHook(() =>
        useAssetForm({ asset: mockAsset, mode: 'update-value', onSubmit: mockSubmit })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.value).toBeDefined();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('should call onSubmit with valid value update', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAssetForm({ asset: mockAsset, mode: 'update-value', onSubmit: mockSubmit })
      );

      await act(async () => {
        result.current.setField('value', '110000');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockSubmit).toHaveBeenCalled();
      expect(result.current.errors).toEqual({});
    });
  });

  describe('error handling', () => {
    it('should show errors for all invalid fields', async () => {
      const { result } = renderHook(() => useAssetForm());

      await act(async () => {
        result.current.setField('value', 'invalid');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.name).toBeDefined();
      expect(result.current.errors.value).toBeDefined();
    });

    it('should clear error when field is fixed', async () => {
      const { result } = renderHook(() => useAssetForm());

      // Generate errors
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.name).toBeDefined();

      // Fix the name error
      await act(async () => {
        result.current.setField('name' as any, 'Valid Name');
      });

      expect(result.current.errors.name).toBeUndefined();
    });
  });
});
