import {
  validateAssetForm,
  transformFormToAsset,
  validateAssetValueUpdate,
  getAssetFormFromValue,
} from './manualAsset.utils';
import { AssetType, CurrencyCode } from '@/types/enums';
import type { AssetFormData, AssetValueUpdateData } from './manualAsset.utils';
import type { ManualAsset } from '@/types/models';

describe('manualAsset.utils', () => {
  describe('validateAssetForm', () => {
    const validFormData: AssetFormData = {
      name: 'Investment Portfolio',
      type: AssetType.STOCKS_AND_SHARES,
      currencyCode: CurrencyCode.USD,
      value: '10000',
      date: '2024-01-01',
      notes: 'My investments',
    };

    it('should return no errors for valid form data', () => {
      const errors = validateAssetForm(validFormData);
      expect(errors).toEqual([]);
    });

    it('should return error when name is empty', () => {
      const formData = { ...validFormData, name: '' };
      const errors = validateAssetForm(formData);
      expect(errors).toContainEqual({
        field: 'name',
        message: 'Asset name is required',
      });
    });

    it('should return error when name is only whitespace', () => {
      const formData = { ...validFormData, name: '   ' };
      const errors = validateAssetForm(formData);
      expect(errors).toContainEqual({
        field: 'name',
        message: 'Asset name is required',
      });
    });

    it('should return error when type is missing', () => {
      const formData = { ...validFormData, type: '' as any };
      const errors = validateAssetForm(formData);
      expect(errors).toContainEqual({
        field: 'type',
        message: 'Asset type is required',
      });
    });

    it('should return error when currencyCode is missing', () => {
      const formData = { ...validFormData, currencyCode: '' as any };
      const errors = validateAssetForm(formData);
      expect(errors).toContainEqual({
        field: 'currencyCode',
        message: 'Currency is required',
      });
    });

    it('should return error when value is not a valid number', () => {
      const formData = { ...validFormData, value: 'invalid' };
      const errors = validateAssetForm(formData);
      expect(errors).toContainEqual({
        field: 'value',
        message: 'Value must be a valid number',
      });
    });

    it('should return error when date is missing', () => {
      const formData = { ...validFormData, date: '' };
      const errors = validateAssetForm(formData);
      expect(errors).toContainEqual({
        field: 'date',
        message: 'Date is required',
      });
    });

    it('should accept valid asset without notes', () => {
      const formData: AssetFormData = {
        name: 'Real Estate',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        value: '500000',
        date: '2024-01-01',
      };
      const errors = validateAssetForm(formData);
      expect(errors).toEqual([]);
    });

    it('should return multiple errors when multiple fields are invalid', () => {
      const formData: AssetFormData = {
        name: '',
        type: '' as any,
        currencyCode: '' as any,
        value: 'invalid',
        date: '',
      };
      const errors = validateAssetForm(formData);
      expect(errors.length).toBe(5);
    });
  });

  describe('transformFormToAsset', () => {
    it('should transform valid form data to ManualAsset entity', () => {
      const formData: AssetFormData = {
        name: 'Stocks',
        type: AssetType.STOCKS_AND_SHARES,
        currencyCode: CurrencyCode.USD,
        value: '25000.50',
        date: '2024-01-15',
        notes: 'Tech stocks',
      };

      const result = transformFormToAsset(formData);

      expect(result).toEqual({
        name: 'Stocks',
        type: AssetType.STOCKS_AND_SHARES,
        currencyCode: CurrencyCode.USD,
        valueHistory: [
          {
            date: '2024-01-15',
            value: 25000.5,
            notes: 'Tech stocks',
          },
        ],
      });
    });

    it('should trim name', () => {
      const formData: AssetFormData = {
        name: '  Car  ',
        type: AssetType.OTHER,
        currencyCode: CurrencyCode.AUD,
        value: '30000',
        date: '2024-01-01',
      };

      const result = transformFormToAsset(formData);

      expect(result.name).toBe('Car');
    });

    it('should trim notes if provided', () => {
      const formData: AssetFormData = {
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        value: '500000',
        date: '2024-01-01',
        notes: '  Primary residence  ',
      };

      const result = transformFormToAsset(formData);

      expect(result.valueHistory[0].notes).toBe('Primary residence');
    });

    it('should set notes to undefined if empty after trim', () => {
      const formData: AssetFormData = {
        name: 'Asset',
        type: AssetType.OTHER,
        currencyCode: CurrencyCode.USD,
        value: '1000',
        date: '2024-01-01',
        notes: '   ',
      };

      const result = transformFormToAsset(formData);

      expect(result.valueHistory[0].notes).toBeUndefined();
    });

    it('should set notes to undefined if not provided', () => {
      const formData: AssetFormData = {
        name: 'Asset',
        type: AssetType.OTHER,
        currencyCode: CurrencyCode.USD,
        value: '1000',
        date: '2024-01-01',
      };

      const result = transformFormToAsset(formData);

      expect(result.valueHistory[0].notes).toBeUndefined();
    });

    it('should parse value as float', () => {
      const formData: AssetFormData = {
        name: 'Asset',
        type: AssetType.SUPERANNUATION,
        currencyCode: CurrencyCode.USD,
        value: '12345.67',
        date: '2024-01-01',
      };

      const result = transformFormToAsset(formData);

      expect(result.valueHistory[0].value).toBe(12345.67);
      expect(typeof result.valueHistory[0].value).toBe('number');
    });
  });

  describe('validateAssetValueUpdate', () => {
    const mockAsset: ManualAsset = {
      id: 'asset-1',
      name: 'Portfolio',
      type: AssetType.STOCKS_AND_SHARES,
      currencyCode: CurrencyCode.USD,
      valueHistory: [
        { date: '2024-01-01', value: 10000 },
        { date: '2024-02-01', value: 11000 },
      ],
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const validUpdateData: AssetValueUpdateData = {
      date: '2024-03-01',
      value: '12000',
      note: 'Quarterly update',
    };

    it('should return no errors for valid update data', () => {
      const errors = validateAssetValueUpdate(validUpdateData, mockAsset);
      expect(errors).toEqual([]);
    });

    it('should return error when date is missing', () => {
      const updateData = { ...validUpdateData, date: '' };
      const errors = validateAssetValueUpdate(updateData, mockAsset);
      expect(errors).toContainEqual({
        field: 'date',
        message: 'Date is required',
      });
    });

    it('should return error when value is not a valid number', () => {
      const updateData = { ...validUpdateData, value: 'invalid' };
      const errors = validateAssetValueUpdate(updateData, mockAsset);
      expect(errors).toContainEqual({
        field: 'value',
        message: 'Value must be a valid number',
      });
    });

    it('should return error when date already exists in history', () => {
      const updateData = { ...validUpdateData, date: '2024-01-01' };
      const errors = validateAssetValueUpdate(updateData, mockAsset);
      expect(errors).toContainEqual({
        field: 'date',
        message: 'An entry already exists for this date',
      });
    });

    it('should accept update without note', () => {
      const updateData: AssetValueUpdateData = {
        date: '2024-03-01',
        value: '12000',
      };
      const errors = validateAssetValueUpdate(updateData, mockAsset);
      expect(errors).toEqual([]);
    });

    it('should return multiple errors when multiple fields are invalid', () => {
      const updateData: AssetValueUpdateData = {
        date: '2024-01-01', // Duplicate
        value: 'invalid',
      };
      const errors = validateAssetValueUpdate(updateData, mockAsset);
      expect(errors.length).toBe(2);
    });
  });

  describe('getAssetFormFromValue', () => {
    it('should return the same form data', () => {
      const formData: AssetFormData = {
        name: 'Asset',
        type: AssetType.LIABILITY,
        currencyCode: CurrencyCode.USD,
        value: '1000',
        date: '2024-01-01',
      };

      const result = getAssetFormFromValue(formData);

      expect(result).toBe(formData);
    });
  });
});
