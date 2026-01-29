import { transactionTypeService } from './transactionType.service';
import { db } from '../db/database';

jest.mock('./syncMetadata.service', () => ({
  syncMetadataService: {
    setLastModified: jest.fn(),
  },
}));

import { syncMetadataService } from './syncMetadata.service';
import type { TransactionType } from '../types/models';

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
  },
}));

describe('transactionTypeService', () => {
  const mockTransactionType: TransactionType = {
    id: 1,
    name: 'Test Type',
    categoryId: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
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

      const result = await transactionTypeService.getByCategoryId(1);

      expect(result).toEqual([mockTransactionType]);
      expect(db.transactionTypes.where).toHaveBeenCalledWith('categoryId');
      expect(mockWhere.equals).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a new transaction type', async () => {
      const newType = {
        name: 'New Type',
        categoryId: 1,
      };
      (db.transactionTypes.add as jest.Mock).mockResolvedValue(2);

      const id = await transactionTypeService.create(newType);

      expect(id).toBe(2);
      expect(db.transactionTypes.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newType,
          isActive: true,
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

      await transactionTypeService.update(1, { name: 'Updated Type' });

      expect(db.transactionTypes.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'Updated Type',
          updatedAt: expect.any(String),
        })
      );
    });
  });

  describe('delete', () => {
    it('should hard delete a transaction type', async () => {
      (db.transactionTypes.delete as jest.Mock).mockResolvedValue(undefined);

      await transactionTypeService.delete(1);

      expect(db.transactionTypes.delete).toHaveBeenCalledWith(1);
      expect(
        syncMetadataService.setLastModified
      ).toHaveBeenCalled();
    });
  });

  describe('archive/unarchive', () => {
    it('should archive a transaction type', async () => {
      (db.transactionTypes.get as jest.Mock).mockResolvedValue(mockTransactionType);
      (db.transactionTypes.update as jest.Mock).mockResolvedValue(1);

      await transactionTypeService.archive(1);

      expect(db.transactionTypes.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          isActive: false,
        })
      );
    });

    it('should unarchive a transaction type', async () => {
      (db.transactionTypes.get as jest.Mock).mockResolvedValue(mockTransactionType);
      (db.transactionTypes.update as jest.Mock).mockResolvedValue(1);

      await transactionTypeService.unarchive(1);

      expect(db.transactionTypes.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          isActive: true,
        })
      );
    });
  });
});
