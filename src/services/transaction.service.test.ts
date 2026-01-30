import { TransactionService } from './transaction.service';
import { db } from '../db/database';
import type { Transaction } from '../types/models';
import type { SyncMetadataService } from './syncMetadata.service';

const mockSyncMetadataService = {
  setLastModified: jest.fn(),
} as unknown as SyncMetadataService;

jest.mock('../db/database', () => ({
  db: {
    transactions: {
      toArray: jest.fn(),
      get: jest.fn(),
      filter: jest.fn(),
      where: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('transactionService', () => {
  let transactionService: TransactionService;
  const mockTransaction: Transaction = {
    id: 'txn-1',
    date: '2024-01-15',
    fromAccountId: 'acc-1',
    transactionTypeId: 'type-1',
    amount: 100,
    description: 'Test transaction',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    transactionService = new TransactionService(db, mockSyncMetadataService);
  });

  describe('getAll', () => {
    it('should return all transactions', async () => {
      (db.transactions.toArray as jest.Mock).mockResolvedValue([mockTransaction]);

      const result = await transactionService.getAll();

      expect(result).toEqual([mockTransaction]);
      expect(db.transactions.toArray).toHaveBeenCalled();
    });
  });

  describe('getActive', () => {
    it('should return only non-deleted transactions', async () => {
      const mockFilter = {
        toArray: jest.fn().mockResolvedValue([mockTransaction]),
      };
      (db.transactions.filter as jest.Mock).mockReturnValue(mockFilter);

      const result = await transactionService.getActive();

      expect(result).toEqual([mockTransaction]);
      expect(db.transactions.filter).toHaveBeenCalled();
    });
  });

  describe('getByDateRange', () => {
    it('should return transactions within date range', async () => {
      const mockBetween = jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([mockTransaction]),
      });
      (db.transactions.where as jest.Mock).mockReturnValue({
        between: mockBetween,
      });

      const result = await transactionService.getByDateRange('2024-01-01', '2024-01-31');

      expect(result).toEqual([mockTransaction]);
      expect(db.transactions.where).toHaveBeenCalledWith('date');
      expect(mockBetween).toHaveBeenCalledWith('2024-01-01', '2024-01-31', true, true);
    });
  });

  describe('create', () => {
    it('should create a new transaction with defaults', async () => {
      const newTransaction = {
        date: '2024-02-01',
        fromAccountId: 'acc-1',
        transactionTypeId: 'type-1',
        amount: 200,
        description: 'New transaction',
      };
      (db.transactions.add as jest.Mock).mockResolvedValue('2');

      const id = await transactionService.create(newTransaction);

      expect(id).toBe('2');
      expect(db.transactions.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newTransaction,
          isDeleted: false,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
    });
  });

  describe('update', () => {
    it('should update an existing transaction', async () => {
      (db.transactions.get as jest.Mock).mockResolvedValue(mockTransaction);
      (db.transactions.update as jest.Mock).mockResolvedValue(1);

      await transactionService.update('txn-1', { amount: 150 });

      expect(db.transactions.update).toHaveBeenCalledWith(
        'txn-1',
        expect.objectContaining({
          amount: 150,
          updatedAt: expect.any(String),
        })
      );
    });

    it('should throw error if transaction not found', async () => {
      (db.transactions.get as jest.Mock).mockResolvedValue(undefined);

      await expect(transactionService.update('999', { amount: 100 })).rejects.toThrow(
        'Transaction with id 999 not found'
      );
    });
  });

  describe('delete', () => {
    it('should soft delete a transaction', async () => {
      (db.transactions.get as jest.Mock).mockResolvedValue(mockTransaction);
      (db.transactions.update as jest.Mock).mockResolvedValue(1);

      await transactionService.delete('txn-1');

      expect(db.transactions.update).toHaveBeenCalledWith(
        'txn-1',
        expect.objectContaining({
          isDeleted: true,
          updatedAt: expect.any(String),
        })
      );
    });
  });
});
