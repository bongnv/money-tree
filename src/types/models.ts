import { AccountType, Group, AssetType } from './enums';

/**
 * Currency model
 * Represents a currency used in the application
 */
export interface Currency {
  id: string;
  code: string; // e.g., 'USD', 'EUR'
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
  currencyId: string;
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
  group: Group;
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
  description?: string;
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
  period: 'monthly' | 'quarterly' | 'yearly'; // Period type for this budget
  startDate: string; // Start date (YYYY-MM-DD)
  endDate: string; // End date (YYYY-MM-DD)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Asset Value History model
 * Represents a historical value entry for a manual asset
 */
export interface AssetValueHistory {
  date: string; // Date string in YYYY-MM-DD format
  value: number; // Value at this date (can be negative for liabilities)
  notes?: string; // Optional notes about this value update
}

/**
 * Manual Asset model
 * Represents manually tracked assets and liabilities (not connected to accounts)
 */
export interface ManualAsset {
  id: string;
  name: string;
  type: AssetType;
  value: number; // Current value (can be negative for liabilities)
  currencyId: string;
  date: string; // Date string in YYYY-MM-DD format - date of valuation
  notes?: string;
  valueHistory?: AssetValueHistory[]; // Historical values (excluding current)
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
}

/**
 * Archived Year Reference
 * References an archived year file with summary data
 */
export interface ArchivedYearReference {
  year: number;
  fileName: string;
  archivedDate: string; // ISO date string
  summary: YearEndSummary;
}

/**
 * Year Data
 * Data for a single year
 */
export interface YearData {
  transactions: Transaction[];
  budgets: Budget[];
  manualAssets: ManualAsset[];
}

/**
 * Data File model
 * Represents the complete data structure with multi-year support
 * Note: Currencies are not stored in the data file as they are fixed defaults
 */
export interface DataFile {
  version: string; // Schema version for future compatibility
  years: Record<string, YearData>; // year as string key -> year data
  accounts: Account[]; // Shared across all years
  categories: Category[]; // Shared across all years
  transactionTypes: TransactionType[]; // Shared across all years
  archivedYears: ArchivedYearReference[]; // References to archived years
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
  archivedDate: string; // ISO date string
  summary: YearEndSummary;
}
