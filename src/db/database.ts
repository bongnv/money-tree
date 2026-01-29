import Dexie, { Table } from 'dexie';
import type {
  Transaction,
  Account,
  Category,
  TransactionType,
  Budget,
  ManualAsset,
  ExchangeRate,
} from '../types/models';

interface SyncMetadata {
  key: string;
  value: unknown;
}

export class MoneyTreeDB extends Dexie {
  transactions!: Table<Transaction>;
  accounts!: Table<Account>;
  categories!: Table<Category>;
  transactionTypes!: Table<TransactionType>;
  budgets!: Table<Budget>;
  manualAssets!: Table<ManualAsset>;
  exchangeRates!: Table<ExchangeRate>;
  syncMetadata!: Table<SyncMetadata>;

  constructor() {
    super('MoneyTreeDB');

    this.version(1).stores({
      // Transactions: indexed by date, type, accounts for fast queries
      transactions:
        'id, date, transactionTypeId, fromAccountId, toAccountId, fromAssetId, toAssetId, isDeleted, [date+transactionTypeId], [fromAccountId+date], [toAccountId+date]',

      // Accounts: indexed by type, currency, active status
      accounts: 'id, name, type, currencyCode, isActive, [type+isActive]',

      // Categories: indexed by deleted status
      categories: 'id, name, isDeleted',

      // Transaction Types: indexed by category and group
      transactionTypes: 'id, name, categoryId, group, isActive, [categoryId+isActive]',

      // Budgets: indexed by date range and deleted status
      budgets: 'id, transactionTypeId, period, startDate, endDate, isDeleted, [startDate+endDate]',

      // Manual Assets: indexed by type, currency, and deleted status
      manualAssets: 'id, name, type, currencyCode, isDeleted',

      // Exchange Rates: compound index for fast lookups
      exchangeRates: 'id, month, fromCurrency, toCurrency, [month+fromCurrency+toCurrency]',

      // Sync Metadata: key-value store
      syncMetadata: 'key',
    });
  }
}

export const db = new MoneyTreeDB();
