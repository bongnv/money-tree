import { z } from 'zod';
import { AccountType, BudgetPeriod, Group, AssetType } from '../types/enums';

/**
 * Zod schema for Currency
 */
export const CurrencySchema = z.object({
  id: z.string().min(1, 'ID is required'),
  code: z.string().min(1, 'Currency code is required').max(10),
  symbol: z.string().min(1, 'Currency symbol is required'),
  name: z.string().min(1, 'Currency name is required'),
  decimalPlaces: z.number().int().min(0).max(10),
});

/**
 * Zod schema for Account
 */
export const AccountSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Account name is required'),
  type: z.nativeEnum(AccountType),
  currencyId: z.string().min(1, 'Currency ID is required'),
  initialBalance: z.number(),
  description: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Zod schema for Category
 */
export const CategorySchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Category name is required'),
  group: z.nativeEnum(Group),
  parentId: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Zod schema for TransactionType
 */
export const TransactionTypeSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Transaction type name is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Zod schema for Transaction
 */
export const TransactionSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  transactionTypeId: z.string().min(1, 'Transaction type ID is required'),
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Zod schema for BudgetItem
 */
export const BudgetItemSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  transactionTypeId: z.string().min(1, 'Transaction type ID is required'),
  plannedAmount: z.number().nonnegative('Planned amount cannot be negative'),
  notes: z.string().optional(),
});

/**
 * Zod schema for Budget
 */
export const BudgetSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Budget name is required'),
  period: z.nativeEnum(BudgetPeriod),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  items: z.array(BudgetItemSchema),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Zod schema for ManualAsset
 */
export const ManualAssetSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Asset name is required'),
  type: z.nativeEnum(AssetType),
  value: z.number(),
  currencyId: z.string().min(1, 'Currency ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Zod schema for DataFile
 * Note: Currencies are not stored in the data file as they are fixed defaults
 */
export const DataFileSchema = z.object({
  version: z.string().min(1, 'Version is required'),
  year: z.number().int().min(1900).max(2100),
  accounts: z.array(AccountSchema).nullable().optional().transform(val => val ?? []),
  categories: z.array(CategorySchema).nullable().optional().transform(val => val ?? []),
  transactionTypes: z.array(TransactionTypeSchema).nullable().optional().transform(val => val ?? []),
  transactions: z.array(TransactionSchema).nullable().optional().transform(val => val ?? []),
  budgets: z.array(BudgetSchema).nullable().optional().transform(val => val ?? []),
  manualAssets: z.array(ManualAssetSchema).nullable().optional().transform(val => val ?? []),
  lastModified: z.string().datetime(),
});

