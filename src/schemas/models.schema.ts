import { z } from 'zod';
import { AccountType, Group, AssetType, CurrencyCode } from '@/types/enums';

/**
 * Zod schema for Currency
 */
export const CurrencySchema = z.object({
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
  currencyCode: z.nativeEnum(CurrencyCode),
  initialBalance: z.number(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Zod schema for Category
 */
export const CategorySchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Category name is required'),
  parentId: z.string().optional(),
  description: z.string().optional(),
  isDeleted: z.boolean().default(false),
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
  group: z.nativeEnum(Group),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  defaultFromAccountId: z.string().optional(),
  defaultToAccountId: z.string().optional(),
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
  amount: z.number(),
  transactionTypeId: z.string().min(1, 'Transaction type ID is required'),
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
  fromAssetId: z.string().optional(),
  toAssetId: z.string().optional(),
  isDeleted: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Zod schema for Budget
 */
export const BudgetSchema = z
  .object({
    id: z.string().min(1, 'ID is required'),
    transactionTypeId: z.string().min(1, 'Transaction type ID is required'),
    amount: z.number().positive('Amount must be greater than 0'),
    currencyCode: z.nativeEnum(CurrencyCode),
    period: z.enum(['monthly', 'quarterly', 'yearly']),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
    isDeleted: z.boolean().default(false),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

/**
 * Zod schema for ExchangeRate
 */
export const ExchangeRateSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  fromCurrency: z.string().min(1, 'From currency is required').max(10),
  toCurrency: z.string().min(1, 'To currency is required').max(10),
  rate: z.number().positive('Rate must be positive'),
  createdAt: z.string().datetime(),
});

/**
 * Zod schema for AssetValueHistory
 */
export const AssetValueHistorySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  value: z.number(),
  notes: z.string().optional(),
});

/**
 * Zod schema for ManualAsset
 */
export const ManualAssetSchema = z
  .object({
    id: z.string().min(1, 'ID is required'),
    name: z.string().min(1, 'Asset name is required'),
    type: z.nativeEnum(AssetType),
    currencyCode: z.nativeEnum(CurrencyCode),
    valueHistory: z
      .array(AssetValueHistorySchema)
      .min(1, 'At least one value history entry is required'),
    isDeleted: z.boolean().default(false),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .refine(
    (data) => {
      // Validate that all dates are in chronological order
      if (data.valueHistory.length > 1) {
        for (let i = 1; i < data.valueHistory.length; i++) {
          if (data.valueHistory[i].date < data.valueHistory[i - 1].date) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message: 'Value history entries must be in chronological order',
      path: ['valueHistory'],
    }
  );

/**
 * Zod schema for YearEndSummary
 */
export const YearEndSummarySchema = z.object({
  transactionCount: z.number().int().min(0),
  closingNetWorth: z.number(),
  closingBalances: z.record(z.string(), z.number()),
  closingAssetValuations: z.record(z.string(), z.number()),
});

/**
 * Zod schema for ArchivedYearReference
 */
export const ArchivedYearReferenceSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  archivedDate: z.string().datetime(),
  summary: YearEndSummarySchema,
});

/**
 * Zod schema for DataFile
 * Note: Currencies are not stored in the data file as they are fixed defaults
 */
export const DataFileSchema = z.object({
  version: z.string().min(1, 'Version is required'),
  transactions: z
    .array(TransactionSchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  budgets: z
    .array(BudgetSchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  manualAssets: z
    .array(ManualAssetSchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  exchangeRates: z
    .array(ExchangeRateSchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  accounts: z
    .array(AccountSchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  categories: z
    .array(CategorySchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  transactionTypes: z
    .array(TransactionTypeSchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  archivedYears: z
    .array(ArchivedYearReferenceSchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  baseCurrency: z.string().default(CurrencyCode.USD),
  lastModified: z.string().datetime(),
});

/**
 * Zod schema for ArchiveFile
 */
export const ArchiveFileSchema = z.object({
  version: z.string().min(1, 'Version is required'),
  year: z.number().int().min(1900).max(2100),
  accounts: z
    .array(AccountSchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  categories: z
    .array(CategorySchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  transactionTypes: z
    .array(TransactionTypeSchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  transactions: z
    .array(TransactionSchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  budgets: z
    .array(BudgetSchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  manualAssets: z
    .array(ManualAssetSchema)
    .nullable()
    .optional()
    .transform((val) => val ?? []),
  archivedDate: z.string().datetime(),
  summary: YearEndSummarySchema,
});
