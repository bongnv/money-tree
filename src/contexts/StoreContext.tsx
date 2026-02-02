import React, { createContext, useContext, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { generateId } from '@/utils/id.utils';
import type {
  Transaction,
  Account,
  Budget,
  Category,
  TransactionType,
  ManualAsset,
  ExchangeRate,
  AssetValueHistory,
  ArchivedYearReference,
} from '@/types/models';
import { CurrencyCode } from '@/types/enums';

// Default state when data is loading
const DEFAULT_DATA = {
  transactions: [] as Transaction[],
  accounts: [] as Account[],
  budgets: [] as Budget[],
  categories: [] as Category[],
  transactionTypes: [] as TransactionType[],
  assets: [] as ManualAsset[],
  exchangeRates: [] as ExchangeRate[],
  baseCurrency: CurrencyCode.USD,
  archivedYears: [] as ArchivedYearReference[],
};

// Utility functions for timestamps
const addTimestamps = (entity: Partial<any>, isUpdate = false): Partial<any> => {
  const now = new Date().toISOString();
  return {
    ...entity,
    createdAt: isUpdate ? entity.createdAt : entity.createdAt || now,
    updatedAt: now,
  };
};

const softDelete = (entity: Partial<any>): Partial<any> => ({
  ...entity,
  isDeleted: true,
});

// Sync metadata helper
const setLastModified = async (): Promise<void> => {
  await db.syncMetadata.put({ key: 'lastModified', value: new Date().toISOString() });
};
interface StoreContextValue {
  // Data
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  categories: Category[];
  transactionTypes: TransactionType[];
  assets: ManualAsset[];
  exchangeRates: ExchangeRate[];
  baseCurrency: CurrencyCode;
  archivedYears: ArchivedYearReference[];

  // Transaction operations
  addTransaction: (
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => Promise<string>;
  updateTransaction: (
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Account operations
  addAccount: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateAccount: (
    id: string,
    data: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  archiveAccount: (id: string) => Promise<void>;
  unarchiveAccount: (id: string) => Promise<void>;

  // Budget operations
  addBudget: (
    data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => Promise<string>;
  updateBudget: (
    id: string,
    data: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Category operations
  addCategory: (
    data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => Promise<string>;
  updateCategory: (
    id: string,
    data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // TransactionType operations
  addTransactionType: (
    data: Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  updateTransactionType: (
    id: string,
    data: Partial<Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  deleteTransactionType: (id: string) => Promise<void>;

  // Asset operations
  addAsset: (
    data: Omit<ManualAsset, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => Promise<string>;
  updateAsset: (
    id: string,
    data: Partial<Omit<ManualAsset, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  addAssetValueHistory: (assetId: string, entry: AssetValueHistory) => Promise<void>;

  // SyncMetadata operations
  setBaseCurrency: (currency: CurrencyCode) => Promise<void>;
  addArchivedYear: (year: ArchivedYearReference) => Promise<void>;
  // ExchangeRate operations
  addExchangeRate: (data: Omit<ExchangeRate, 'id' | 'createdAt'>) => Promise<string>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  // Single reactive query for ALL data
  const data = useLiveQuery(
    async () => {
      const [
        transactions,
        accounts,
        budgets,
        categories,
        transactionTypes,
        assets,
        exchangeRates,
        baseCurrencyRecord,
        archivedYearsRecord,
      ] = await Promise.all([
        db.transactions.filter((txn) => !txn.isDeleted).toArray(),
        db.accounts.filter((account) => !account.isDeleted).toArray(),
        db.budgets.filter((budget) => !budget.isDeleted).toArray(),
        db.categories.filter((category) => !category.isDeleted).toArray(),
        db.transactionTypes.filter((type) => !type.isDeleted).toArray(),
        db.manualAssets.filter((asset) => !asset.isDeleted).toArray(),
        db.exchangeRates.toArray(),
        db.syncMetadata.get('baseCurrency'),
        db.syncMetadata.get('archivedYears'),
      ]);

      return {
        transactions,
        accounts,
        budgets,
        categories,
        transactionTypes,
        assets,
        exchangeRates,
        baseCurrency: (baseCurrencyRecord?.value as CurrencyCode) || CurrencyCode.USD,
        archivedYears: (archivedYearsRecord?.value as ArchivedYearReference[]) || [],
      };
    },
    [],
    DEFAULT_DATA
  );

  // ============== Transaction Operations ==============
  const addTransaction = useCallback(
    async (txnData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
      const id = generateId();
      const transaction = addTimestamps({
        ...txnData,
        id,
        isDeleted: false,
      });
      await db.transactions.add(transaction as Transaction);
      await setLastModified();
      return id;
    },
    []
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const existing = await db.transactions.get(id);
      if (!existing) {
        throw new Error(`Transaction with id ${id} not found`);
      }
      const updated = addTimestamps(updates, true);
      await db.transactions.update(id, updated);
      await setLastModified();
    },
    []
  );

  const deleteTransaction = useCallback(async (id: string) => {
    const existing = await db.transactions.get(id);
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found`);
    }
    const deleted = addTimestamps(softDelete(existing), true);
    await db.transactions.update(id, deleted);
    await setLastModified();
  }, []);

  // ============== Account Operations ==============
  const addAccount = useCallback(
    async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = generateId();
      const account = addTimestamps({
        ...accountData,
        id,
        isActive: accountData.isActive ?? true,
        isDeleted: false,
      });
      await db.accounts.add(account as Account);
      await setLastModified();
      return id;
    },
    []
  );

  const updateAccount = useCallback(
    async (id: string, updates: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const existing = await db.accounts.get(id);
      if (!existing) {
        throw new Error(`Account with id ${id} not found`);
      }
      const updated = addTimestamps(updates, true);
      await db.accounts.update(id, updated);
      await setLastModified();
    },
    []
  );

  const deleteAccount = useCallback(async (id: string) => {
    const existing = await db.accounts.get(id);
    if (!existing) {
      throw new Error(`Account with id ${id} not found`);
    }
    const deleted = addTimestamps(softDelete(existing), true);
    await db.accounts.update(id, deleted);
    await setLastModified();
  }, []);

  const archiveAccount = useCallback(
    async (id: string) => {
      await updateAccount(id, { isActive: false });
    },
    [updateAccount]
  );

  const unarchiveAccount = useCallback(
    async (id: string) => {
      await updateAccount(id, { isActive: true });
    },
    [updateAccount]
  );

  // ============== Budget Operations ==============
  const addBudget = useCallback(
    async (budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
      const id = generateId();
      const budget = addTimestamps({
        ...budgetData,
        id,
        isDeleted: false,
      });
      await db.budgets.add(budget as Budget);
      await setLastModified();
      return id;
    },
    []
  );

  const updateBudget = useCallback(
    async (id: string, updates: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const existing = await db.budgets.get(id);
      if (!existing) {
        throw new Error(`Budget with id ${id} not found`);
      }
      const updated = addTimestamps(updates, true);
      await db.budgets.update(id, updated);
      await setLastModified();
    },
    []
  );

  const deleteBudget = useCallback(async (id: string) => {
    const existing = await db.budgets.get(id);
    if (!existing) {
      throw new Error(`Budget with id ${id} not found`);
    }
    const deleted = addTimestamps(softDelete(existing), true);
    await db.budgets.update(id, deleted);
    await setLastModified();
  }, []);

  // ============== Category Operations ==============
  const addCategory = useCallback(
    async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
      const id = generateId();
      const category = addTimestamps({
        ...categoryData,
        id,
        isDeleted: false,
      });
      await db.categories.add(category as Category);
      await setLastModified();
      return id;
    },
    []
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const existing = await db.categories.get(id);
      if (!existing) {
        throw new Error(`Category with id ${id} not found`);
      }
      const updated = addTimestamps(updates, true);
      await db.categories.update(id, updated);
      await setLastModified();
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    const existing = await db.categories.get(id);
    if (!existing) {
      throw new Error(`Category with id ${id} not found`);
    }
    const deleted = addTimestamps(softDelete(existing), true);
    await db.categories.update(id, deleted);
    await setLastModified();
  }, []);

  // ============== TransactionType Operations ==============
  const addTransactionType = useCallback(
    async (typeData: Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = generateId();
      const transactionType = addTimestamps({
        ...typeData,
        id,
        isActive: typeData.isActive ?? true,
        isDeleted: false,
      });
      await db.transactionTypes.add(transactionType as TransactionType);
      await setLastModified();
      return id;
    },
    []
  );

  const updateTransactionType = useCallback(
    async (
      id: string,
      updates: Partial<Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>>
    ) => {
      const existing = await db.transactionTypes.get(id);
      if (!existing) {
        throw new Error(`TransactionType with id ${id} not found`);
      }
      const updated = addTimestamps(updates, true);
      await db.transactionTypes.update(id, updated);
      await setLastModified();
    },
    []
  );

  const deleteTransactionType = useCallback(async (id: string) => {
    const existing = await db.transactionTypes.get(id);
    if (!existing) {
      throw new Error(`TransactionType with id ${id} not found`);
    }
    const deleted = addTimestamps(softDelete(existing), true);
    await db.transactionTypes.update(id, deleted);
    await setLastModified();
  }, []);

  // ============== Asset Operations ==============
  const addAsset = useCallback(
    async (assetData: Omit<ManualAsset, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
      const id = generateId();
      const asset = addTimestamps({
        ...assetData,
        id,
        isDeleted: false,
        valueHistory: assetData.valueHistory || [],
      });
      await db.manualAssets.add(asset as ManualAsset);
      await setLastModified();
      return id;
    },
    []
  );

  const updateAsset = useCallback(
    async (id: string, updates: Partial<Omit<ManualAsset, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const existing = await db.manualAssets.get(id);
      if (!existing) {
        throw new Error(`Asset with id ${id} not found`);
      }
      const updated = addTimestamps(updates, true);
      await db.manualAssets.update(id, updated);
      await setLastModified();
    },
    []
  );

  const deleteAsset = useCallback(async (id: string) => {
    const existing = await db.manualAssets.get(id);
    if (!existing) {
      throw new Error(`Asset with id ${id} not found`);
    }
    const deleted = addTimestamps(softDelete(existing), true);
    await db.manualAssets.update(id, deleted);
    await setLastModified();
  }, []);

  const addAssetValueHistory = useCallback(
    async (assetId: string, entry: AssetValueHistory) => {
      const existing = await db.manualAssets.get(assetId);
      if (!existing) {
        throw new Error(`Asset with id ${assetId} not found`);
      }

      const updatedHistory = [...(existing.valueHistory || []), entry].sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      await updateAsset(assetId, { valueHistory: updatedHistory });
    },
    [updateAsset]
  );

  const addExchangeRate = useCallback(async (rateData: Omit<ExchangeRate, 'id' | 'createdAt'>) => {
    const id = generateId();
    const rate = addTimestamps({ ...rateData, id });
    await db.exchangeRates.add(rate as ExchangeRate);
    await setLastModified();
    return id;
  }, []);

  const setBaseCurrency = useCallback(async (currency: CurrencyCode) => {
    await db.syncMetadata.put({ key: 'baseCurrency', value: currency });
    await setLastModified();
  }, []);

  const addArchivedYear = useCallback(async (year: ArchivedYearReference) => {
    const record = await db.syncMetadata.get('archivedYears');
    const current = (record?.value as ArchivedYearReference[]) || [];
    await db.syncMetadata.put({ key: 'archivedYears', value: [...current, year] });
    await setLastModified();
  }, []);

  const value: StoreContextValue = {
    transactions: data.transactions,
    accounts: data.accounts,
    budgets: data.budgets,
    categories: data.categories,
    transactionTypes: data.transactionTypes,
    assets: data.assets,
    exchangeRates: data.exchangeRates,
    baseCurrency: data.baseCurrency,
    archivedYears: data.archivedYears,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    archiveAccount,
    unarchiveAccount,
    addBudget,
    updateBudget,
    deleteBudget,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransactionType,
    updateTransactionType,
    deleteTransactionType,
    addAsset,
    updateAsset,
    deleteAsset,
    setBaseCurrency,
    addArchivedYear,
    addAssetValueHistory,
    addExchangeRate,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreContextValue => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
};
