import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { db } from '@/db/database';
import { CurrencyCode, AssetType, AccountType, Group } from '@/types/enums';
import type { Transaction, ManualAsset } from '@/types/models';
import { StoreProvider, useStore } from './StoreContext';

// Mock dexie-react-hooks
jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: <T,>(queryFn: () => Promise<T>, _deps: unknown[], defaultValue: T) => {
    const [data, setData] = React.useState<T>(defaultValue);

    React.useEffect(() => {
      void queryFn()
        .then(setData)
        .catch(() => setData(defaultValue));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return data;
  },
}));

// Mock the database
jest.mock('@/db/database', () => ({
  db: {
    transactions: {
      filter: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
      add: jest.fn(),
      update: jest.fn(),
      get: jest.fn(),
    },
    accounts: {
      filter: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
      add: jest.fn(),
      update: jest.fn(),
      get: jest.fn(),
    },
    budgets: {
      filter: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
      add: jest.fn(),
      update: jest.fn(),
      get: jest.fn(),
    },
    categories: {
      filter: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
      add: jest.fn(),
      update: jest.fn(),
      get: jest.fn(),
    },
    transactionTypes: {
      filter: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
      add: jest.fn(),
      update: jest.fn(),
      get: jest.fn(),
    },
    manualAssets: {
      filter: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
      add: jest.fn(),
      update: jest.fn(),
      get: jest.fn(),
    },
    exchangeRates: {
      toArray: jest.fn().mockResolvedValue([]),
      add: jest.fn(),
    },
    syncMetadata: {
      get: jest.fn().mockResolvedValue(undefined),
      put: jest.fn(),
    },
  },
}));

// Mock utils
jest.mock('@/utils/id.utils', () => ({
  generateId: jest.fn(() => 'test-id-123'),
}));

jest.mock('@/utils/exchangeRate.utils', () => ({
  ensureCurrentMonthRates: jest.fn(),
}));

describe('StoreContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider>{children}</StoreProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider initialization', () => {
    it('should provide default data when loading', () => {
      const { result } = renderHook(() => useStore(), { wrapper });

      expect(result.current.transactions).toEqual([]);
      expect(result.current.accounts).toEqual([]);
      expect(result.current.baseCurrency).toBe(CurrencyCode.USD);
      expect(result.current.isStoreLoaded).toBe(false);
    });

    it('should load data from database', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'tx1',
          date: '2024-01-01',
          amount: 100,
          transactionTypeId: 'type1',
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (db.transactions.filter as jest.Mock).mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockTransactions),
      });

      const { result } = renderHook(() => useStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isStoreLoaded).toBe(true);
      });

      expect(result.current.transactions).toEqual(mockTransactions);
    });
  });

  describe('Transaction operations', () => {
    it('should add a transaction', async () => {
      (db.transactions.add as jest.Mock).mockResolvedValue('test-id-123');

      const { result } = renderHook(() => useStore(), { wrapper });

      const txnData = {
        date: '2024-01-01',
        amount: 100,
        transactionTypeId: 'type1',
      };

      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      const id = await result.current.addTransaction(txnData);

      expect(id).toBe('test-id-123');
      expect(db.transactions.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...txnData,
          id: 'test-id-123',
          isDeleted: false,
        })
      );
      expect(db.syncMetadata.put).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'lastModified' })
      );
    });

    it('should update a transaction', async () => {
      const mockTransaction = {
        id: 'tx1',
        date: '2024-01-01',
        amount: 100,
        transactionTypeId: 'type1',
        isDeleted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (db.transactions.get as jest.Mock).mockResolvedValue(mockTransaction);
      (db.transactions.update as jest.Mock).mockResolvedValue(1);

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      await result.current.updateTransaction('tx1', { amount: 200 });

      expect(db.transactions.update).toHaveBeenCalledWith(
        'tx1',
        expect.objectContaining({
          amount: 200,
        })
      );
      expect(db.syncMetadata.put).toHaveBeenCalled();
    });

    it('should soft delete a transaction', async () => {
      const mockTransaction = {
        id: 'tx1',
        date: '2024-01-01',
        amount: 100,
        transactionTypeId: 'type1',
        isDeleted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (db.transactions.get as jest.Mock).mockResolvedValue(mockTransaction);
      (db.transactions.update as jest.Mock).mockResolvedValue(1);

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      await result.current.deleteTransaction('tx1');

      expect(db.transactions.update).toHaveBeenCalledWith(
        'tx1',
        expect.objectContaining({
          isDeleted: true,
        })
      );
    });
  });

  describe('Account operations', () => {
    it('should add an account', async () => {
      (db.accounts.add as jest.Mock).mockResolvedValue('test-id-123');

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      const accountData = {
        name: 'Bank Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: 1000,
        isActive: true,
        isDeleted: false,
      };

      const id = await result.current.addAccount(accountData);

      expect(id).toBe('test-id-123');
      expect(db.accounts.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...accountData,
          id: 'test-id-123',
        })
      );
    });

    it('should update an account', async () => {
      const mockAccount = {
        id: 'acc1',
        name: 'Old Name',
        type: 'bank_account' as const,
        currencyCode: CurrencyCode.USD,
        initialBalance: 1000,
        isActive: true,
        isDeleted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (db.accounts.get as jest.Mock).mockResolvedValue(mockAccount);
      (db.accounts.update as jest.Mock).mockResolvedValue(1);

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      await result.current.updateAccount('acc1', { name: 'New Name' });

      expect(db.accounts.update).toHaveBeenCalledWith(
        'acc1',
        expect.objectContaining({
          name: 'New Name',
        })
      );
    });

    it('should archive an account', async () => {
      const mockAccount = {
        id: 'acc1',
        name: 'Bank Account',
        type: 'bank_account' as const,
        currencyCode: CurrencyCode.USD,
        initialBalance: 1000,
        isActive: true,
        isDeleted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (db.accounts.get as jest.Mock).mockResolvedValue(mockAccount);
      (db.accounts.update as jest.Mock).mockResolvedValue(1);

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      await result.current.archiveAccount('acc1');

      expect(db.accounts.update).toHaveBeenCalledWith(
        'acc1',
        expect.objectContaining({
          isActive: false,
        })
      );
    });

    it('should unarchive an account', async () => {
      const mockAccount = {
        id: 'acc1',
        name: 'Bank Account',
        type: 'bank_account' as const,
        currencyCode: CurrencyCode.USD,
        initialBalance: 1000,
        isActive: false,
        isDeleted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (db.accounts.get as jest.Mock).mockResolvedValue(mockAccount);
      (db.accounts.update as jest.Mock).mockResolvedValue(1);

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      await result.current.unarchiveAccount('acc1');

      expect(db.accounts.update).toHaveBeenCalledWith(
        'acc1',
        expect.objectContaining({
          isActive: true,
        })
      );
    });
  });

  describe('Budget operations', () => {
    it('should add a budget', async () => {
      (db.budgets.add as jest.Mock).mockResolvedValue('test-id-123');

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      const budgetData = {
        transactionTypeId: 'type1',
        amount: 500,
        currencyCode: CurrencyCode.USD,
        period: 'monthly' as const,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const id = await result.current.addBudget(budgetData);

      expect(id).toBe('test-id-123');
      expect(db.budgets.add).toHaveBeenCalled();
    });

    it('should update a budget', async () => {
      const mockBudget = {
        id: 'budget1',
        transactionTypeId: 'type1',
        amount: 500,
        currencyCode: CurrencyCode.USD,
        period: 'monthly' as const,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isDeleted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (db.budgets.get as jest.Mock).mockResolvedValue(mockBudget);
      (db.budgets.update as jest.Mock).mockResolvedValue(1);

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      await result.current.updateBudget('budget1', { amount: 600 });

      expect(db.budgets.update).toHaveBeenCalledWith(
        'budget1',
        expect.objectContaining({ amount: 600 })
      );
    });
  });

  describe('Category operations', () => {
    it('should add a category', async () => {
      (db.categories.add as jest.Mock).mockResolvedValue('test-id-123');

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      const categoryData = {
        name: 'Food',
        description: 'Food expenses',
      };

      const id = await result.current.addCategory(categoryData);

      expect(id).toBe('test-id-123');
      expect(db.categories.add).toHaveBeenCalled();
    });
  });

  describe('TransactionType operations', () => {
    it('should add a transaction type', async () => {
      (db.transactionTypes.add as jest.Mock).mockResolvedValue('test-id-123');

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      const typeData = {
        name: 'Groceries',
        categoryId: 'cat1',
        group: Group.EXPENSE,
        isActive: true,
        isDeleted: false,
      };

      const id = await result.current.addTransactionType(typeData);

      expect(id).toBe('test-id-123');
      expect(db.transactionTypes.add).toHaveBeenCalled();
    });
  });

  describe('Asset operations', () => {
    it('should add an asset', async () => {
      (db.manualAssets.add as jest.Mock).mockResolvedValue('test-id-123');

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      const assetData = {
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        valueHistory: [{ date: '2024-01-01', value: 500000 }],
      };

      const id = await result.current.addAsset(assetData);

      expect(id).toBe('test-id-123');
      expect(db.manualAssets.add).toHaveBeenCalled();
    });

    it('should add asset value history', async () => {
      const mockAsset: ManualAsset = {
        id: 'asset1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        valueHistory: [{ date: '2024-01-01', value: 500000 }],
        isDeleted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (db.manualAssets.get as jest.Mock).mockResolvedValue(mockAsset);
      (db.manualAssets.update as jest.Mock).mockResolvedValue(1);

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      const newEntry = { date: '2024-02-01', value: 510000 };
      await result.current.addAssetValueHistory('asset1', newEntry);

      expect(db.manualAssets.update).toHaveBeenCalledWith(
        'asset1',
        expect.objectContaining({
          valueHistory: expect.arrayContaining([newEntry]),
        })
      );
    });
  });

  describe('Metadata operations', () => {
    it('should set base currency', async () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      await result.current.setBaseCurrency(CurrencyCode.AUD);

      expect(db.syncMetadata.put).toHaveBeenCalledWith({
        key: 'baseCurrency',
        value: CurrencyCode.AUD,
      });
    });

    it('should add archived year', async () => {
      (db.syncMetadata.get as jest.Mock).mockResolvedValue({ key: 'archivedYears', value: [] });

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      const archivedYear = {
        year: 2023,
        archivedDate: '2024-01-01T00:00:00Z',
        summary: {
          transactionCount: 100,
          closingNetWorth: 50000,
          closingBalances: {},
          closingAssetValuations: {},
        },
      };

      await result.current.addArchivedYear(archivedYear);

      expect(db.syncMetadata.put).toHaveBeenCalledWith({
        key: 'archivedYears',
        value: expect.arrayContaining([archivedYear]),
      });
    });
  });

  describe('Exchange rates', () => {
    it('should compute exchange rates map', async () => {
      const mockRates = [
        {
          id: 'rate1',
          month: '2024-01',
          fromCurrency: CurrencyCode.USD,
          toCurrency: CurrencyCode.VND,
          rate: 24000,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      (db.exchangeRates.toArray as jest.Mock).mockResolvedValue(mockRates);

      const { result } = renderHook(() => useStore(), { wrapper });

      await waitFor(() => {
        expect(result.current.isStoreLoaded).toBe(true);
      });

      expect(result.current.exchangeRatesMap.size).toBeGreaterThan(0);
    });

    it('should add exchange rate', async () => {
      (db.exchangeRates.add as jest.Mock).mockResolvedValue('test-id-123');

      const { result } = renderHook(() => useStore(), { wrapper });
      await waitFor(() => expect(result.current.isStoreLoaded).toBe(true));

      const rateData = {
        month: '2024-01',
        fromCurrency: CurrencyCode.USD,
        toCurrency: CurrencyCode.VND,
        rate: 24000,
      };

      const id = await result.current.addExchangeRate(rateData);

      expect(id).toBe('test-id-123');
      expect(db.exchangeRates.add).toHaveBeenCalled();
    });
  });
});
