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
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Data File model
 * Represents the complete data structure for a year
 * Note: Currencies are not stored in the data file as they are fixed defaults
 */
export interface DataFile {
  version: string; // Schema version for future compatibility
  year: number;
  accounts: Account[];
  categories: Category[];
  transactionTypes: TransactionType[];
  transactions: Transaction[];
  budgets: Budget[];
  manualAssets: ManualAsset[];
  lastModified: string; // ISO date string
}

