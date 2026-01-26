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
  value: any;
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
        'id, date, transactionTypeId, fromAccountId, toAccountId, fromAssetId, toAssetId, [date+transactionTypeId], [fromAccountId+date], [toAccountId+date]',

      // Accounts: indexed by type, currency, active status
      accounts: 'id, name, type, currencyCode, isActive, [type+isActive]',

      // Categories: simple table
      categories: 'id, name',

      // Transaction Types: indexed by category and group
      transactionTypes: 'id, name, categoryId, group, isActive, [categoryId+isActive]',

      // Budgets: indexed by date range for fast queries
      budgets: 'id, transactionTypeId, period, startDate, endDate, [startDate+endDate]',

      // Manual Assets: indexed by type and currency
      manualAssets: 'id, name, type, currencyCode',

      // Exchange Rates: compound index for fast lookups
      exchangeRates: 'id, month, fromCurrency, toCurrency, [month+fromCurrency+toCurrency]',

      // Sync Metadata: key-value store
      syncMetadata: 'key',
    });
  }
}

export const db = new MoneyTreeDB();

// Helper functions for sync metadata
export const syncMetadata = {
  async get(key: string): Promise<any> {
    const record = await db.syncMetadata.get(key);
    return record?.value;
  },

  async set(key: string, value: any): Promise<void> {
    await db.syncMetadata.put({ key, value });
  },

  async getLastModified(): Promise<string | null> {
    return this.get('lastModified');
  },

  async setLastModified(timestamp: string): Promise<void> {
    await this.set('lastModified', timestamp);
  },

  async getBaseCurrency(): Promise<string | null> {
    return this.get('baseCurrency');
  },

  async setBaseCurrency(currency: string): Promise<void> {
    await this.set('baseCurrency', currency);
    await this.setLastModified(new Date().toISOString());
  },

  async getArchivedYears(): Promise<any[]> {
    return (await this.get('archivedYears')) || [];
  },

  async setArchivedYears(years: any[]): Promise<void> {
    await this.set('archivedYears', years);
    await this.setLastModified(new Date().toISOString());
  },

  async addArchivedYear(year: any): Promise<void> {
    const current = await this.getArchivedYears();
    await this.setArchivedYears([...current, year]);
  },

  async clear(): Promise<void> {
    await db.syncMetadata.clear();
  },
};
