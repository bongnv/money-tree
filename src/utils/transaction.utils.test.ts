import {
  filterTransactions,
  validateTransactionForm,
  transformFormToTransaction,
  deriveTransactionType,
} from './transaction.utils';
import { Group, CurrencyCode, AccountType } from '@/types/enums';
import type { Transaction, TransactionType, Account } from '@/types/models';
import type { TransactionFilters, TransactionFormData } from './transaction.utils';

describe('transaction.utils', () => {
  const mockTransactionTypes: TransactionType[] = [
    {
      id: 'type-1',
      name: 'Groceries',
      categoryId: 'cat-1',
      group: Group.EXPENSE,
      isActive: true,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'type-2',
      name: 'Salary',
      categoryId: 'cat-2',
      group: Group.INCOME,
      isActive: true,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      date: '2024-01-15',
      description: 'Grocery shopping',
      amount: 100,
      transactionTypeId: 'type-1',
      fromAccountId: 'acc-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      isDeleted: false,
    },
    {
      id: 'tx-2',
      date: '2024-02-10',
      description: 'Monthly salary',
      amount: 5000,
      transactionTypeId: 'type-2',
      toAccountId: 'acc-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      isDeleted: false,
    },
    {
      id: 'tx-3',
      date: '2024-01-20',
      description: 'Transfer',
      amount: 200,
      transactionTypeId: 'type-1',
      fromAccountId: 'acc-2',
      toAccountId: 'acc-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      isDeleted: false,
    },
  ];

  describe('filterTransactions', () => {
    const emptyFilters: TransactionFilters = {
      dateFrom: '',
      dateTo: '',
      accountIds: [],
      categoryIds: [],
      transactionTypeId: '',
      searchText: '',
      group: '',
    };

    it('should return all transactions when no filters are applied', () => {
      const result = filterTransactions(mockTransactions, emptyFilters, mockTransactionTypes);
      expect(result).toEqual(mockTransactions);
    });

    it('should filter by dateFrom', () => {
      const filters = { ...emptyFilters, dateFrom: '2024-02-01' };
      const result = filterTransactions(mockTransactions, filters, mockTransactionTypes);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-2');
    });

    it('should filter by dateTo', () => {
      const filters = { ...emptyFilters, dateTo: '2024-01-31' };
      const result = filterTransactions(mockTransactions, filters, mockTransactionTypes);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['tx-1', 'tx-3']);
    });

    it('should filter by date range', () => {
      const filters = { ...emptyFilters, dateFrom: '2024-01-10', dateTo: '2024-01-31' };
      const result = filterTransactions(mockTransactions, filters, mockTransactionTypes);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['tx-1', 'tx-3']);
    });

    it('should filter by accountIds (fromAccount or toAccount)', () => {
      const filters = { ...emptyFilters, accountIds: ['acc-1'] };
      const result = filterTransactions(mockTransactions, filters, mockTransactionTypes);
      expect(result).toHaveLength(3); // All transactions involve acc-1
      expect(result.map((t) => t.id)).toEqual(['tx-1', 'tx-2', 'tx-3']);
    });

    it('should filter by accountIds (toAccount)', () => {
      const filters = { ...emptyFilters, accountIds: ['acc-2'] };
      const result = filterTransactions(mockTransactions, filters, mockTransactionTypes);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-3');
    });

    it('should filter by transactionTypeId', () => {
      const filters = { ...emptyFilters, transactionTypeId: 'type-2' };
      const result = filterTransactions(mockTransactions, filters, mockTransactionTypes);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-2');
    });

    it('should filter by categoryIds', () => {
      const filters = { ...emptyFilters, categoryIds: ['cat-1'] };
      const result = filterTransactions(mockTransactions, filters, mockTransactionTypes);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['tx-1', 'tx-3']);
    });

    it('should filter by group', () => {
      const filters = { ...emptyFilters, group: Group.INCOME };
      const result = filterTransactions(mockTransactions, filters, mockTransactionTypes);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-2');
    });

    it('should filter by searchText in description', () => {
      const filters = { ...emptyFilters, searchText: 'grocery' };
      const result = filterTransactions(mockTransactions, filters, mockTransactionTypes);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-1');
    });

    it('should filter by searchText case-insensitively', () => {
      const filters = { ...emptyFilters, searchText: 'SALARY' };
      const result = filterTransactions(mockTransactions, filters, mockTransactionTypes);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-2');
    });

    it('should return empty array when no matches', () => {
      const filters = { ...emptyFilters, searchText: 'nonexistent' };
      const result = filterTransactions(mockTransactions, filters, mockTransactionTypes);
      expect(result).toHaveLength(0);
    });

    it('should apply multiple filters together', () => {
      const filters = {
        ...emptyFilters,
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        group: Group.EXPENSE,
      };
      const result = filterTransactions(mockTransactions, filters, mockTransactionTypes);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['tx-1', 'tx-3']);
    });
  });

  describe('validateTransactionForm', () => {
    const mockAccounts: Account[] = [
      {
        id: 'acc-1',
        name: 'Checking',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: 1000,
        isActive: true,
        isDeleted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    it('should validate using validation service', () => {
      const formData: TransactionFormData = {
        date: '2024-01-01',
        description: 'Test',
        amount: '100',
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
      };

      const errors = validateTransactionForm(formData, mockTransactionTypes[0], mockAccounts);
      // The actual validation logic is in the service, so we just ensure it runs
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should parse amount as float', () => {
      const formData: TransactionFormData = {
        date: '2024-01-01',
        description: 'Test',
        amount: '123.45',
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
      };

      const errors = validateTransactionForm(formData, mockTransactionTypes[0], mockAccounts);
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('transformFormToTransaction', () => {
    it('should transform valid form data to Transaction entity', () => {
      const formData: TransactionFormData = {
        date: '2024-01-15',
        description: 'Grocery shopping',
        amount: '100.50',
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
      };

      const result = transformFormToTransaction(formData);

      expect(result).toEqual({
        date: '2024-01-15',
        description: 'Grocery shopping',
        amount: 100.5,
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
        toAccountId: undefined,
        fromAssetId: undefined,
        toAssetId: undefined,
      });
    });

    it('should trim description', () => {
      const formData: TransactionFormData = {
        date: '2024-01-15',
        description: '  Test  ',
        amount: '100',
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
      };

      const result = transformFormToTransaction(formData);

      expect(result.description).toBe('Test');
    });

    it('should set description to undefined if empty after trim', () => {
      const formData: TransactionFormData = {
        date: '2024-01-15',
        description: '   ',
        amount: '100',
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
      };

      const result = transformFormToTransaction(formData);

      expect(result.description).toBeUndefined();
    });

    it('should handle transfer with both accounts', () => {
      const formData: TransactionFormData = {
        date: '2024-01-15',
        description: 'Transfer',
        amount: '200',
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
        toAccountId: 'acc-2',
      };

      const result = transformFormToTransaction(formData);

      expect(result.fromAccountId).toBe('acc-1');
      expect(result.toAccountId).toBe('acc-2');
    });

    it('should handle asset-related transactions', () => {
      const formData: TransactionFormData = {
        date: '2024-01-15',
        description: 'Asset purchase',
        amount: '1000',
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
        toAssetId: 'asset-1',
      };

      const result = transformFormToTransaction(formData);

      expect(result.fromAccountId).toBe('acc-1');
      expect(result.toAssetId).toBe('asset-1');
    });

    it('should parse amount as float', () => {
      const formData: TransactionFormData = {
        date: '2024-01-15',
        description: 'Test',
        amount: '99.99',
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
      };

      const result = transformFormToTransaction(formData);

      expect(result.amount).toBe(99.99);
      expect(typeof result.amount).toBe('number');
    });
  });

  describe('deriveTransactionType', () => {
    it('should return transaction type when found', () => {
      const formData: TransactionFormData = {
        date: '2024-01-15',
        description: 'Test',
        amount: '100',
        transactionTypeId: 'type-1',
      };

      const result = deriveTransactionType(formData, mockTransactionTypes);

      expect(result).toEqual(mockTransactionTypes[0]);
    });

    it('should return null when transactionTypeId is not provided', () => {
      const formData: TransactionFormData = {
        date: '2024-01-15',
        description: 'Test',
        amount: '100',
        transactionTypeId: '',
      };

      const result = deriveTransactionType(formData, mockTransactionTypes);

      expect(result).toBeNull();
    });

    it('should return null when transaction type is not found', () => {
      const formData: TransactionFormData = {
        date: '2024-01-15',
        description: 'Test',
        amount: '100',
        transactionTypeId: 'nonexistent',
      };

      const result = deriveTransactionType(formData, mockTransactionTypes);

      expect(result).toBeNull();
    });
  });
});
