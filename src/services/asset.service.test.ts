import { assetService } from './asset.service';
import { db } from '../db/database';

jest.mock('./syncMetadata.service', () => ({
  syncMetadataService: {
    setLastModified: jest.fn(),
  },
}));

import { AssetType } from '../types/enums';
import type { ManualAsset } from '../types/models';

jest.mock('../db/database', () => ({
  db: {
    manualAssets: {
      toArray: jest.fn(),
      get: jest.fn(),
      filter: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('assetService', () => {
  const mockAsset: ManualAsset = {
    id: 1,
    name: 'Test Asset',
    type: AssetType.REAL_ESTATE,
    currentValue: 500000,
    currency: 'USD',
    valueHistory: [],
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
        type: AssetType.INVESTMENT,
        currentValue: 10000,
        currency: 'USD',
      };
      (db.manualAssets.add as jest.Mock).mockResolvedValue(1);

      const id = await assetService.create(newAsset);

      expect(id).toBe(1);
      expect(db.manualAssets.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newAsset,
          isDeleted: false,
          valueHistory: [],
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
      expect(
        syncMetadataService.setLastModified
      ).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing asset', async () => {
      (db.manualAssets.get as jest.Mock).mockResolvedValue(mockAsset);
      (db.manualAssets.update as jest.Mock).mockResolvedValue(1);

      await assetService.update(1, { currentValue: 550000 });

      expect(db.manualAssets.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          currentValue: 550000,
          updatedAt: expect.any(String),
        })
      );
      expect(
        syncMetadataService.setLastModified
      ).toHaveBeenCalled();
    });

    it('should throw error if asset not found', async () => {
      (db.manualAssets.get as jest.Mock).mockResolvedValue(undefined);

      await expect(assetService.update(999, { currentValue: 100 })).rejects.toThrow(
        'Asset with id 999 not found'
      );
    });
  });

  describe('delete', () => {
    it('should soft delete an asset', async () => {
      (db.manualAssets.get as jest.Mock).mockResolvedValue(mockAsset);
      (db.manualAssets.update as jest.Mock).mockResolvedValue(1);

      await assetService.delete(1);

      expect(db.manualAssets.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          isDeleted: true,
          updatedAt: expect.any(String),
        })
      );
      expect(
        syncMetadataService.setLastModified
      ).toHaveBeenCalled();
    });

    it('should throw error if asset not found', async () => {
      (db.manualAssets.get as jest.Mock).mockResolvedValue(undefined);

      await expect(assetService.delete(999)).rejects.toThrow('Asset with id 999 not found');
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
});
