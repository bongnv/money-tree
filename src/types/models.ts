import { AccountType, Group, AssetType, CurrencyCode } from './enums';

/**
 * Currency model
 * Represents a currency used in the application
 */
export interface Currency {
  code: string; // e.g., 'USD', 'VND' (ISO 4217)
  symbol: string; // e.g., '$', '€'
  name: string; // e.g., 'US Dollar', 'Euro'
  decimalPlaces: number; // e.g., 2 for most currencies
}

/**
 * Account model
 * Represents a financial account (bank account, credit card, etc.)
 */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currencyCode: CurrencyCode;
  initialBalance: number;
  description?: string;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Category model
 * Represents a category for organizing transaction types
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Transaction Type model
 * Represents a specific type of transaction within a category
 */
export interface TransactionType {
  id: string;
  name: string;
  categoryId: string;
  group: Group;
  description?: string;
  isActive?: boolean;
  defaultFromAccountId?: string; // Default from account (TRANSFER group only)
  defaultToAccountId?: string; // Default to account (TRANSFER group only)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Transaction model
 * Represents a financial transaction
 */
export interface Transaction {
  id: string;
  date: string; // Date string in YYYY-MM-DD format
  description?: string;
  amount: number; // Positive value, always
  transactionTypeId: string;
  fromAccountId?: string; // For expenses and transfers
  toAccountId?: string; // For income and transfers
  fromAssetId?: string; // For asset liquidation (asset → account)
  toAssetId?: string; // For asset purchase (account → asset)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Budget model
 * Represents a budget for a specific transaction type with flexible period
 */
export interface Budget {
  id: string;
  transactionTypeId: string;
  amount: number; // Budget amount
  currencyCode: CurrencyCode; // Budget amount currency
  period: 'monthly' | 'quarterly' | 'yearly'; // Period type for this budget
  startDate: string; // Start date (YYYY-MM-DD)
  endDate: string; // End date (YYYY-MM-DD)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Exchange Rate model
 * Represents an exchange rate for a specific month and currency pair
 */
export interface ExchangeRate {
  id: string;
  month: string; // YYYY-MM format
  fromCurrency: CurrencyCode; // Currency code (e.g., 'EUR')
  toCurrency: CurrencyCode; // Currency code (e.g., 'USD')
  rate: number; // Exchange rate (e.g., 1.18)
  createdAt: string; // ISO date string
}

/**
 * Asset Value History model
 * Represents a historical value entry for a manual asset
 */
export interface AssetValueHistory {
  date: string; // Date string in YYYY-MM-DD format
  value: number; // Value at this date (can be negative for liabilities)
  notes?: string; // Optional notes about this value update
  linkedTransactionId?: string; // Transaction ID if this value change was from a transaction
}

/**
 * Manual Asset model
 * Represents manually tracked assets and liabilities (not connected to accounts)
 */
export interface ManualAsset {
  id: string;
  name: string;
  type: AssetType;
  currencyCode: CurrencyCode;
  notes?: string;
  valueHistory: AssetValueHistory[]; // All historical values, sorted by date (latest is current)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Year End Summary
 * Stores summary information for an archived year
 */
export interface YearEndSummary {
  transactionCount: number;
  closingNetWorth: number;
  closingBalances: Record<string, number>; // accountId -> closing balance
  closingAssetValuations: Record<string, number>; // assetId -> closing valuation
}

/**
 * Archived Year Reference
 * References an archived year file with summary data
 */
export interface ArchivedYearReference {
  year: number;
  archivedDate: string; // ISO date string
  summary: YearEndSummary;
}

/**
 * Data File model
 * Represents the complete data structure with all transactions and data
 * Note: Currencies are not stored in the data file as they are fixed defaults
 */
export interface DataFile {
  version: string; // Schema version for future compatibility
  transactions: Transaction[]; // All transactions (all years)
  budgets: Budget[]; // All budgets (all years)
  manualAssets: ManualAsset[]; // All manual assets (all years)
  exchangeRates: ExchangeRate[]; // All exchange rates (all years)
  accounts: Account[]; // Shared across all years
  categories: Category[]; // Shared across all years
  transactionTypes: TransactionType[]; // Shared across all years
  archivedYears: ArchivedYearReference[]; // References to archived years
  baseCurrency: CurrencyCode; // Base currency for reporting
  lastModified: string; // ISO date string
}

/**
 * Archive File
 * Self-contained archive for a single year
 */
export interface ArchiveFile {
  version: string;
  year: number;
  accounts: Account[]; // Snapshot of accounts at archive time
  categories: Category[]; // Snapshot of categories at archive time
  transactionTypes: TransactionType[]; // Snapshot of transaction types at archive time
  transactions: Transaction[];
  budgets: Budget[];
  manualAssets: ManualAsset[];
  exchangeRates: ExchangeRate[];
  archivedDate: string; // ISO date string
  summary: YearEndSummary;
}
