import { TransactionTypeService } from './transactionType.service';
import { db } from '../db/database';
import type { TransactionType } from '../types/models';
import { Group } from '@/types/enums';
import type { SyncMetadataService } from './syncMetadata.service';

const mockSyncMetadataService = {
  setLastModified: jest.fn(),
} as unknown as SyncMetadataService;

jest.mock('../db/database', () => ({
  db: {
    transactionTypes: {
      toArray: jest.fn(),
      get: jest.fn(),
      filter: jest.fn(),
      where: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    syncMetadata: {
      put: jest.fn(),
      get: jest.fn(),
    },
  },
}));

describe('transactionTypeService', () => {
  let transactionTypeService: TransactionTypeService;
  const mockTransactionType: TransactionType = {
    id: '1',
    name: 'Test Type',
    categoryId: 'cat-1',
    isActive: true,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    group: Group.INCOME,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    transactionTypeService = new TransactionTypeService(db, mockSyncMetadataService);
  });

  describe('getAll', () => {
    it('should return all transaction types', async () => {
      (db.transactionTypes.toArray as jest.Mock).mockResolvedValue([mockTransactionType]);

      const result = await transactionTypeService.getAll();

      expect(result).toEqual([mockTransactionType]);
    });
  });

  describe('getActive', () => {
    it('should return only active transaction types', async () => {
      const mockFilter = {
        toArray: jest.fn().mockResolvedValue([mockTransactionType]),
      };
      (db.transactionTypes.filter as jest.Mock).mockReturnValue(mockFilter);

      const result = await transactionTypeService.getActive();

      expect(result).toEqual([mockTransactionType]);
    });
  });

  describe('getByCategoryId', () => {
    it('should return transaction types by category id', async () => {
      const mockWhere = {
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockTransactionType]),
        }),
      };
      (db.transactionTypes.where as jest.Mock).mockReturnValue(mockWhere);

      const result = await transactionTypeService.getByCategoryId('1');

      expect(result).toEqual([mockTransactionType]);
      expect(db.transactionTypes.where).toHaveBeenCalledWith('categoryId');
      expect(mockWhere.equals).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should create a new transaction type', async () => {
      const newType = {
        name: 'New Type',
        categoryId: 'cat-1',
        group: Group.INCOME,
        isActive: true,
        isDeleted: false,
      };
      (db.transactionTypes.add as jest.Mock).mockResolvedValue('type-2');

      const id = await transactionTypeService.create(newType);

      expect(typeof id).toBe('string');
      expect(id).toBeTruthy();
      expect(db.transactionTypes.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newType,
          isActive: true,
          isDeleted: false,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
    });
  });

  describe('update', () => {
    it('should update an existing transaction type', async () => {
      (db.transactionTypes.get as jest.Mock).mockResolvedValue(mockTransactionType);
      (db.transactionTypes.update as jest.Mock).mockResolvedValue(1);

      await transactionTypeService.update('type-1', { name: 'Updated Type' });

      expect(db.transactionTypes.update).toHaveBeenCalledWith(
        'type-1',
        expect.objectContaining({
          name: 'Updated Type',
          updatedAt: expect.any(String),
        })
      );
    });
  });

  describe('delete', () => {
    it('should soft delete a transaction type', async () => {
      (db.transactionTypes.get as jest.Mock).mockResolvedValue(mockTransactionType);
      (db.transactionTypes.update as jest.Mock).mockResolvedValue(1);

      await transactionTypeService.delete('type-1');

      expect(db.transactionTypes.update).toHaveBeenCalledWith(
        'type-1',
        expect.objectContaining({
          isDeleted: true,
          updatedAt: expect.any(String),
        })
      );
    });

    it('should throw error if transaction type not found', async () => {
      (db.transactionTypes.get as jest.Mock).mockResolvedValue(undefined);

      await expect(transactionTypeService.delete('type-999')).rejects.toThrow(
        'TransactionType with id type-999 not found'
      );
    });
  });

  describe('archive/unarchive', () => {
    it('should archive a transaction type', async () => {
      (db.transactionTypes.get as jest.Mock).mockResolvedValue(mockTransactionType);
      (db.transactionTypes.update as jest.Mock).mockResolvedValue(1);

      await transactionTypeService.archive('type-1');

      expect(db.transactionTypes.update).toHaveBeenCalledWith(
        'type-1',
        expect.objectContaining({
          isActive: false,
        })
      );
    });

    it('should unarchive a transaction type', async () => {
      (db.transactionTypes.get as jest.Mock).mockResolvedValue(mockTransactionType);
      (db.transactionTypes.update as jest.Mock).mockResolvedValue(1);

      await transactionTypeService.unarchive('type-1');

      expect(db.transactionTypes.update).toHaveBeenCalledWith(
        'type-1',
        expect.objectContaining({
          isActive: true,
        })
      );
    });
  });
});
