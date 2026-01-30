import { AssetService } from './asset.service';
import { db } from '../db/database';
import { AssetType, CurrencyCode } from '../types/enums';
import type { ManualAsset } from '../types/models';
import type { SyncMetadataService } from './syncMetadata.service';

const mockSyncMetadataService = {
  setLastModified: jest.fn(),
} as unknown as SyncMetadataService;

jest.mock('../db/database', () => ({
  db: {
    manualAssets: {
      toArray: jest.fn(),
      get: jest.fn(),
      filter: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
    },
    syncMetadata: {
      put: jest.fn(),
      get: jest.fn(),
    },
  },
}));

describe('assetService', () => {
  let assetService: AssetService;
  const mockAsset: ManualAsset = {
    id: '1',
    name: 'Test Asset',
    type: AssetType.REAL_ESTATE,
    currencyCode: CurrencyCode.USD,
    valueHistory: [],
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    assetService = new AssetService(db, mockSyncMetadataService);
  });

  describe('getAll', () => {
    it('should return all assets', async () => {
      (db.manualAssets.toArray as jest.Mock).mockResolvedValue([mockAsset]);

      const result = await assetService.getAll();

      expect(result).toEqual([mockAsset]);
      expect(db.manualAssets.toArray).toHaveBeenCalled();
    });
  });

  describe('getActive', () => {
    it('should return only non-deleted assets', async () => {
      const mockFilter = {
        toArray: jest.fn().mockResolvedValue([mockAsset]),
      };
      (db.manualAssets.filter as jest.Mock).mockReturnValue(mockFilter);

      const result = await assetService.getActive();

      expect(result).toEqual([mockAsset]);
      expect(db.manualAssets.filter).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new asset with default values', async () => {
      const newAsset = {
        name: 'New Asset',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        valueHistory: [],
        isDeleted: false,
      };
      (db.manualAssets.add as jest.Mock).mockResolvedValue('1');

      const id = await assetService.create(newAsset);

      expect(typeof id).toBe('string');
      expect(id).toBeTruthy();
      expect(db.manualAssets.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newAsset,
          isDeleted: false,
          valueHistory: [],
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
    });
  });

  describe('update', () => {
    it('should update an existing asset', async () => {
      (db.manualAssets.get as jest.Mock).mockResolvedValue(mockAsset);
      (db.manualAssets.update as jest.Mock).mockResolvedValue(1);

      await assetService.update('1', {});

      expect(db.manualAssets.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          updatedAt: expect.any(String),
        })
      );
    });

    it('should throw error if asset not found', async () => {
      (db.manualAssets.get as jest.Mock).mockResolvedValue(undefined);

      await expect(assetService.update('999', {})).rejects.toThrow('Asset with id 999 not found');
    });
  });

  describe('delete', () => {
    it('should soft delete an asset', async () => {
      (db.manualAssets.get as jest.Mock).mockResolvedValue(mockAsset);
      (db.manualAssets.update as jest.Mock).mockResolvedValue(1);

      await assetService.delete('1');

      expect(db.manualAssets.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          isDeleted: true,
          updatedAt: expect.any(String),
        })
      );
    });

    it('should throw error if asset not found', async () => {
      (db.manualAssets.get as jest.Mock).mockResolvedValue(undefined);

      await expect(assetService.delete('999')).rejects.toThrow('Asset with id 999 not found');
    });
  });

  describe('addValueHistory', () => {
    it('should add a new value history entry', async () => {
      const assetWithHistory = {
        ...mockAsset,
        valueHistory: [{ date: '2024-01-01', value: 500000 }],
      };
      (db.manualAssets.get as jest.Mock).mockResolvedValue(assetWithHistory);
      (db.manualAssets.update as jest.Mock).mockResolvedValue(1);

      await assetService.addValueHistory('1', {
        date: '2024-02-01',
        value: 510000,
        notes: 'Market increase',
      });

      expect(db.manualAssets.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          valueHistory: expect.arrayContaining([
            expect.objectContaining({
              date: '2024-02-01',
              value: 510000,
              notes: 'Market increase',
            }),
          ]),
          updatedAt: expect.any(String),
        })
      );
    });

    it('should throw error if asset not found', async () => {
      (db.manualAssets.get as jest.Mock).mockResolvedValue(undefined);

      await expect(
        assetService.addValueHistory('999', { date: '2024-01-01', value: 100 })
      ).rejects.toThrow('Asset with id 999 not found');
    });
  });

  describe('validateAssetForm', () => {
    it('should return no errors for valid form data', () => {
      const formData = {
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        value: '500000',
        date: '2024-01-01',
        notes: 'Primary residence',
      };

      const errors = assetService.validateAssetForm(formData);
      expect(errors).toEqual([]);
    });

    it('should return error for empty name', () => {
      const formData = {
        name: '   ',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        value: '500000',
        date: '2024-01-01',
      };

      const errors = assetService.validateAssetForm(formData);
      expect(errors).toContainEqual({ field: 'name', message: 'Asset name is required' });
    });

    it('should return error for missing type', () => {
      const formData = {
        name: 'House',
        type: '' as AssetType,
        currencyCode: CurrencyCode.USD,
        value: '500000',
        date: '2024-01-01',
      };

      const errors = assetService.validateAssetForm(formData);
      expect(errors).toContainEqual({ field: 'type', message: 'Asset type is required' });
    });

    it('should return error for missing currency', () => {
      const formData = {
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: '' as CurrencyCode,
        value: '500000',
        date: '2024-01-01',
      };

      const errors = assetService.validateAssetForm(formData);
      expect(errors).toContainEqual({ field: 'currencyCode', message: 'Currency is required' });
    });

    it('should return error for invalid value', () => {
      const formData = {
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        value: 'not a number',
        date: '2024-01-01',
      };

      const errors = assetService.validateAssetForm(formData);
      expect(errors).toContainEqual({ field: 'value', message: 'Value must be a valid number' });
    });

    it('should return error for missing date', () => {
      const formData = {
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        value: '500000',
        date: '',
      };

      const errors = assetService.validateAssetForm(formData);
      expect(errors).toContainEqual({ field: 'date', message: 'Date is required' });
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const formData = {
        name: '',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        value: 'invalid',
        date: '',
      };

      const errors = assetService.validateAssetForm(formData);
      expect(errors.length).toBe(3);
      expect(errors).toContainEqual({ field: 'name', message: 'Asset name is required' });
      expect(errors).toContainEqual({ field: 'value', message: 'Value must be a valid number' });
      expect(errors).toContainEqual({ field: 'date', message: 'Date is required' });
    });
  });

  describe('transformFormToAsset', () => {
    it('should transform form data to asset object with valueHistory', () => {
      const formData = {
        name: '  House  ',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        value: '500000.50',
        date: '2024-01-15',
        notes: '  Primary residence  ',
      };

      const result = assetService.transformFormToAsset(formData);

      expect(result).toEqual({
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        valueHistory: [
          {
            date: '2024-01-15',
            value: 500000.5,
            notes: 'Primary residence',
          },
        ],
      });
    });

    it('should handle form data without notes', () => {
      const formData = {
        name: 'Car',
        type: AssetType.OTHER,
        currencyCode: CurrencyCode.USD,
        value: '25000',
        date: '2024-01-01',
      };

      const result = assetService.transformFormToAsset(formData);

      expect(result).toEqual({
        name: 'Car',
        type: AssetType.OTHER,
        currencyCode: CurrencyCode.USD,
        valueHistory: [
          {
            date: '2024-01-01',
            value: 25000,
            notes: undefined,
          },
        ],
      });
    });

    it('should handle form data with empty notes', () => {
      const formData = {
        name: 'Investment',
        type: AssetType.OTHER,
        currencyCode: CurrencyCode.SGD,
        value: '10000',
        date: '2024-01-01',
        notes: '   ',
      };

      const result = assetService.transformFormToAsset(formData);

      expect(result.valueHistory[0].notes).toBeUndefined();
    });
  });

  describe('validateAssetValueUpdate', () => {
    const asset: ManualAsset = {
      id: '1',
      name: 'House',
      type: AssetType.REAL_ESTATE,
      currencyCode: CurrencyCode.USD,
      valueHistory: [{ date: '2024-01-01', value: 500000 }],
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should return no errors for valid value update', () => {
      const formData = {
        date: '2024-02-01',
        value: '510000',
        note: 'Market increase',
      };

      const errors = assetService.validateAssetValueUpdate(formData, asset);
      expect(errors).toEqual([]);
    });

    it('should return error for missing date', () => {
      const formData = {
        date: '',
        value: '510000',
      };

      const errors = assetService.validateAssetValueUpdate(formData, asset);
      expect(errors).toContainEqual({ field: 'date', message: 'Date is required' });
    });

    it('should return error for invalid value', () => {
      const formData = {
        date: '2024-02-01',
        value: 'not a number',
      };

      const errors = assetService.validateAssetValueUpdate(formData, asset);
      expect(errors).toContainEqual({ field: 'value', message: 'Value must be a valid number' });
    });

    it('should return error for duplicate date', () => {
      const formData = {
        date: '2024-01-01',
        value: '510000',
      };

      const errors = assetService.validateAssetValueUpdate(formData, asset);
      expect(errors).toContainEqual({
        field: 'date',
        message: 'An entry already exists for this date',
      });
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const formData = {
        date: '2024-01-01',
        value: 'invalid',
      };

      const errors = assetService.validateAssetValueUpdate(formData, asset);
      expect(errors.length).toBe(2);
      expect(errors).toContainEqual({ field: 'value', message: 'Value must be a valid number' });
      expect(errors).toContainEqual({
        field: 'date',
        message: 'An entry already exists for this date',
      });
    });
  });
});
