import { TransactionService } from './transaction.service';
import { db } from '../db/database';
import type { Transaction, TransactionType, Account } from '../types/models';
import type { SyncMetadataService } from './syncMetadata.service';
import { Group, AccountType, CurrencyCode } from '../types/enums';

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

      expect(typeof id).toBe('string');
      expect(id).toBeTruthy();
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

  describe('validateTransactionForm', () => {
    const mockTransactionType: TransactionType = {
      id: 'type-1',
      name: 'Groceries',
      categoryId: 'cat-1',
      group: Group.EXPENSE,
      isActive: true,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    const mockAccounts: Account[] = [
      {
        id: 'acc-1',
        name: 'Checking',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: 1000,
        isActive: true,
        isDeleted: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    it('should return no errors for valid form data', () => {
      const formData = {
        date: '2024-03-15',
        description: 'Weekly groceries',
        amount: '150.50',
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
      };

      const errors = transactionService.validateTransactionForm(
        formData,
        mockTransactionType,
        mockAccounts
      );

      expect(errors).toHaveLength(0);
    });

    it('should return error when date is missing', () => {
      const formData = {
        date: '',
        description: 'Test',
        amount: '100',
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
      };

      const errors = transactionService.validateTransactionForm(
        formData,
        mockTransactionType,
        mockAccounts
      );

      expect(errors).toContainEqual({
        field: 'date',
        message: 'Date is required',
      });
    });

    it('should return error when amount is invalid', () => {
      const formData = {
        date: '2024-03-15',
        description: 'Test',
        amount: 'invalid',
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
      };

      const errors = transactionService.validateTransactionForm(
        formData,
        mockTransactionType,
        mockAccounts
      );

      expect(errors).toContainEqual({
        field: 'amount',
        message: 'Amount is required',
      });
    });

    it('should return error when transaction type is missing', () => {
      const formData = {
        date: '2024-03-15',
        description: 'Test',
        amount: '100',
        transactionTypeId: '',
        fromAccountId: 'acc-1',
      };

      const errors = transactionService.validateTransactionForm(formData, undefined, mockAccounts);

      expect(errors).toContainEqual({
        field: 'transactionTypeId',
        message: 'Transaction type is required',
      });
    });
  });

  describe('transformFormToTransaction', () => {
    it('should transform form data to transaction entity', () => {
      const formData = {
        date: '2024-03-15',
        description: '  Coffee shop  ',
        amount: '4.50',
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
      };

      const result = transactionService.transformFormToTransaction(formData);

      expect(result).toEqual({
        date: '2024-03-15',
        description: 'Coffee shop',
        amount: 4.5,
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
        toAccountId: undefined,
        fromAssetId: undefined,
        toAssetId: undefined,
      });
    });

    it('should handle empty description', () => {
      const formData = {
        date: '2024-03-15',
        description: '   ',
        amount: '100',
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
      };

      const result = transactionService.transformFormToTransaction(formData);

      expect(result.description).toBeUndefined();
    });

    it('should handle transfer between accounts', () => {
      const formData = {
        date: '2024-03-15',
        description: 'Transfer',
        amount: '500',
        transactionTypeId: 'type-transfer',
        fromAccountId: 'acc-1',
        toAccountId: 'acc-2',
      };

      const result = transactionService.transformFormToTransaction(formData);

      expect(result).toEqual({
        date: '2024-03-15',
        description: 'Transfer',
        amount: 500,
        transactionTypeId: 'type-transfer',
        fromAccountId: 'acc-1',
        toAccountId: 'acc-2',
        fromAssetId: undefined,
        toAssetId: undefined,
      });
    });
  });

  describe('deriveTransactionType', () => {
    const mockTransactionTypes: TransactionType[] = [
      {
        id: 'type-1',
        name: 'Groceries',
        categoryId: 'cat-1',
        group: Group.EXPENSE,
        isActive: true,
        isDeleted: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'type-2',
        name: 'Salary',
        categoryId: 'cat-2',
        group: Group.INCOME,
        isActive: true,
        isDeleted: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    it('should return transaction type when found', () => {
      const formData = {
        date: '2024-03-15',
        description: 'Test',
        amount: '100',
        transactionTypeId: 'type-1',
      };

      const result = transactionService.deriveTransactionType(formData, mockTransactionTypes);

      expect(result).toEqual(mockTransactionTypes[0]);
    });

    it('should return null when transaction type ID is empty', () => {
      const formData = {
        date: '2024-03-15',
        description: 'Test',
        amount: '100',
        transactionTypeId: '',
      };

      const result = transactionService.deriveTransactionType(formData, mockTransactionTypes);

      expect(result).toBeNull();
    });

    it('should return null when transaction type not found', () => {
      const formData = {
        date: '2024-03-15',
        description: 'Test',
        amount: '100',
        transactionTypeId: 'invalid-id',
      };

      const result = transactionService.deriveTransactionType(formData, mockTransactionTypes);

      expect(result).toBeNull();
    });
  });
});
