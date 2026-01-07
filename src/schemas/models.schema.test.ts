import {
  CurrencySchema,
  AccountSchema,
  CategorySchema,
  TransactionTypeSchema,
  TransactionSchema,
  BudgetSchema,
  ExchangeRateSchema,
  ManualAssetSchema,
  DataFileSchema,
} from './models.schema';
import { AccountType, Group, AssetType } from '../types/enums';

// Helper to get date in YYYY-MM-DD format
const getDateString = () => new Date().toISOString().split('T')[0];
const getDateTimeString = () => new Date().toISOString();

describe('Model Schemas', () => {
  describe('CurrencySchema', () => {
    it('should validate a valid currency', () => {
      const validCurrency = {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        decimalPlaces: 2,
      };
      expect(() => CurrencySchema.parse(validCurrency)).not.toThrow();
    });

    it('should reject currency with missing fields', () => {
      const invalidCurrency = {
        code: 'USD',
        // missing symbol, name, decimalPlaces
      };
      expect(() => CurrencySchema.parse(invalidCurrency)).toThrow();
    });

    it('should reject currency with invalid decimalPlaces', () => {
      const invalidCurrency = {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        decimalPlaces: -1,
      };
      expect(() => CurrencySchema.parse(invalidCurrency)).toThrow();
    });
  });

  describe('AccountSchema', () => {
    it('should validate a valid account', () => {
      const validAccount = {
        id: 'acc1',
        name: 'Checking Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: 'USD',
        initialBalance: 1000.0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => AccountSchema.parse(validAccount)).not.toThrow();
    });

    it('should validate account with optional description', () => {
      const validAccount = {
        id: 'acc1',
        name: 'Checking Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: 'USD',
        initialBalance: 1000.0,
        description: 'My main checking account',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => AccountSchema.parse(validAccount)).not.toThrow();
    });

    it('should reject account with invalid type', () => {
      const invalidAccount = {
        id: 'acc1',
        name: 'Checking Account',
        type: 'invalid_type',
        currencyCode: 'USD',
        initialBalance: 1000.0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => AccountSchema.parse(invalidAccount)).toThrow();
    });
  });

  describe('CategorySchema', () => {
    it('should validate a valid category', () => {
      const validCategory = {
        id: 'cat1',
        name: 'Food',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => CategorySchema.parse(validCategory)).not.toThrow();
    });

    it('should validate category with parentId', () => {
      const validCategory = {
        id: 'cat2',
        name: 'Groceries',
        parentId: 'cat1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => CategorySchema.parse(validCategory)).not.toThrow();
    });
  });

  describe('TransactionTypeSchema', () => {
    it('should validate a valid transaction type', () => {
      const validTransactionType = {
        id: 'tt1',
        name: 'Grocery Shopping',
        categoryId: 'cat1',
        group: Group.EXPENSE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => TransactionTypeSchema.parse(validTransactionType)).not.toThrow();
    });

    it('should validate transaction type with description', () => {
      const validTransactionType = {
        id: 'tt1',
        name: 'Grocery Shopping',
        categoryId: 'cat1',
        group: Group.EXPENSE,
        description: 'Weekly grocery expenses',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => TransactionTypeSchema.parse(validTransactionType)).not.toThrow();
    });

    it('should reject transaction type with invalid group', () => {
      const invalidTransactionType = {
        id: 'tt1',
        name: 'Grocery Shopping',
        categoryId: 'cat1',
        group: 'invalid_group',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => TransactionTypeSchema.parse(invalidTransactionType)).toThrow();
    });

    it('should validate transaction type with default accounts', () => {
      const validTransactionType = {
        id: 'tt1',
        name: 'Salary Transfer',
        categoryId: 'cat1',
        group: Group.TRANSFER,
        defaultFromAccountId: 'acc1',
        defaultToAccountId: 'acc2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => TransactionTypeSchema.parse(validTransactionType)).not.toThrow();
    });

    it('should validate transaction type with only one default account', () => {
      const validTransactionType = {
        id: 'tt1',
        name: 'Salary Transfer',
        categoryId: 'cat1',
        group: Group.TRANSFER,
        defaultFromAccountId: 'acc1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => TransactionTypeSchema.parse(validTransactionType)).not.toThrow();
    });

    it('should validate transaction type without default accounts', () => {
      const validTransactionType = {
        id: 'tt1',
        name: 'Transfer',
        categoryId: 'cat1',
        group: Group.TRANSFER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => TransactionTypeSchema.parse(validTransactionType)).not.toThrow();
    });
  });

  describe('TransactionSchema', () => {
    it('should validate a valid expense transaction', () => {
      const validTransaction = {
        id: 'tx1',
        date: getDateString(),
        description: 'Grocery store',
        amount: 50.0,
        transactionTypeId: 'tt1',
        fromAccountId: 'acc1',
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => TransactionSchema.parse(validTransaction)).not.toThrow();
    });

    it('should validate a valid income transaction', () => {
      const validTransaction = {
        id: 'tx2',
        date: getDateString(),
        description: 'Salary',
        amount: 3000.0,
        transactionTypeId: 'tt2',
        toAccountId: 'acc1',
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => TransactionSchema.parse(validTransaction)).not.toThrow();
    });

    it('should validate a valid transfer transaction', () => {
      const validTransaction = {
        id: 'tx3',
        date: getDateString(),
        description: 'Transfer to savings',
        amount: 500.0,
        transactionTypeId: 'tt3',
        fromAccountId: 'acc1',
        toAccountId: 'acc2',
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => TransactionSchema.parse(validTransaction)).not.toThrow();
    });

    it('should reject transaction with negative amount', () => {
      const invalidTransaction = {
        id: 'tx1',
        date: new Date().toISOString(),
        description: 'Invalid',
        amount: -50.0,
        transactionTypeId: 'tt1',
        fromAccountId: 'acc1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => TransactionSchema.parse(invalidTransaction)).toThrow();
    });

    it('should reject transaction with zero amount', () => {
      const invalidTransaction = {
        id: 'tx1',
        date: new Date().toISOString(),
        description: 'Invalid',
        amount: 0,
        transactionTypeId: 'tt1',
        fromAccountId: 'acc1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => TransactionSchema.parse(invalidTransaction)).toThrow();
    });
  });

  describe('BudgetSchema', () => {
    it('should validate a valid budget item', () => {
      const validBudget = {
        id: 'bi1',
        transactionTypeId: 'tt1',
        amount: 200.0,
        currencyCode: 'USD',
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      expect(() => BudgetSchema.parse(validBudget)).not.toThrow();
    });

    it('should validate budget item with quarterly period', () => {
      const validBudget = {
        id: 'bi1',
        transactionTypeId: 'tt1',
        amount: 600.0,
        currencyCode: 'USD',
        period: 'quarterly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      expect(() => BudgetSchema.parse(validBudget)).not.toThrow();
    });

    it('should reject budget item with zero or negative amount', () => {
      const invalidBudget = {
        id: 'bi1',
        transactionTypeId: 'tt1',
        amount: 0,
        currencyCode: 'USD',
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      expect(() => BudgetSchema.parse(invalidBudget)).toThrow();
    });
  });

  describe('ExchangeRateSchema', () => {
    it('should validate a valid exchange rate', () => {
      const validRate = {
        id: 'rate-1',
        month: '2026-01',
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.18,
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      expect(() => ExchangeRateSchema.parse(validRate)).not.toThrow();
    });

    it('should reject exchange rate with invalid month format', () => {
      const invalidRate = {
        id: 'rate-1',
        month: '2026/01',
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.18,
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      expect(() => ExchangeRateSchema.parse(invalidRate)).toThrow();
    });

    it('should reject exchange rate with negative or zero rate', () => {
      const invalidRate = {
        id: 'rate-1',
        month: '2026-01',
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      expect(() => ExchangeRateSchema.parse(invalidRate)).toThrow();
    });

    it('should reject exchange rate with missing currency codes', () => {
      const invalidRate = {
        id: 'rate-1',
        month: '2026-01',
        fromCurrency: '',
        toCurrency: 'USD',
        rate: 1.18,
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      expect(() => ExchangeRateSchema.parse(invalidRate)).toThrow();
    });
  });

  describe('ManualAssetSchema', () => {
    it('should validate a valid manual asset', () => {
      const validAsset = {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [{ date: getDateString(), value: 500000, notes: 'Primary residence' }],
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(validAsset)).not.toThrow();
    });

    it('should validate asset without optional notes', () => {
      const validAsset = {
        id: 'asset-1',
        name: 'Super Fund',
        type: AssetType.SUPERANNUATION,
        currencyCode: 'USD',
        valueHistory: [{ date: getDateString(), value: 25000 }],
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(validAsset)).not.toThrow();
    });

    it('should reject asset with missing id', () => {
      const invalidAsset = {
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [{ date: getDateString(), value: 500000 }],
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(invalidAsset)).toThrow();
    });

    it('should reject asset with empty name', () => {
      const invalidAsset = {
        id: 'asset-1',
        name: '',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [{ date: getDateString(), value: 500000 }],
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(invalidAsset)).toThrow();
    });

    it('should reject asset with invalid type', () => {
      const invalidAsset = {
        id: 'asset-1',
        name: 'House',
        type: 'invalid_type',
        currencyCode: 'USD',
        valueHistory: [{ date: getDateString(), value: 500000 }],
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(invalidAsset)).toThrow();
    });

    it('should validate all asset types', () => {
      Object.values(AssetType).forEach((type) => {
        const asset = {
          id: 'asset-1',
          name: 'Test Asset',
          type,
          currencyCode: 'USD',
          valueHistory: [{ date: getDateString(), value: 10000 }],
          createdAt: getDateTimeString(),
          updatedAt: getDateTimeString(),
        };
        expect(() => ManualAssetSchema.parse(asset)).not.toThrow();
      });
    });

    it('should validate asset with value history', () => {
      const assetWithHistory = {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [
          { date: '2026-01-01', value: 500000, notes: 'Initial purchase' },
          { date: '2026-04-01', value: 510000 },
        ],
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(assetWithHistory)).not.toThrow();
    });

    it('should validate asset with multiple history entries in chronological order', () => {
      const assetWithHistory = {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [
          { date: '2026-01-01', value: 500000 },
          { date: '2026-04-01', value: 510000 },
          { date: '2026-07-01', value: 520000 },
          { date: '2026-10-01', value: 530000 },
        ],
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(assetWithHistory)).not.toThrow();
    });

    it('should reject asset with history entries not in chronological order', () => {
      const invalidAsset = {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [
          { date: '2026-04-01', value: 510000 },
          { date: '2026-01-01', value: 500000 }, // Out of order
        ],
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(invalidAsset)).toThrow();
    });

    it('should reject asset with missing valueHistory', () => {
      const invalidAsset = {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(invalidAsset)).toThrow();
    });

    it('should reject asset with empty valueHistory', () => {
      const invalidAsset = {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [],
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(invalidAsset)).toThrow();
    });

    it('should validate history entry without optional notes', () => {
      const assetWithHistory = {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [
          { date: '2026-01-01', value: 500000 }, // No notes
          { date: '2026-04-01', value: 510000 },
        ],
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(assetWithHistory)).not.toThrow();
    });

    it('should reject history entry with invalid date format', () => {
      const invalidAsset = {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [
          { date: '01/01/2026', value: 500000 }, // Invalid format
        ],
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(invalidAsset)).toThrow();
    });
  });

  describe('DataFileSchema', () => {
    it('should validate a valid data file', () => {
      const validDataFile = {
        version: '1.0.0',
        years: {
          '2026': {
            transactions: [],
            budgets: [],
            manualAssets: [],
          },
        },
        accounts: [],
        categories: [],
        transactionTypes: [],
        archivedYears: [],
        lastModified: new Date().toISOString(),
      };
      expect(() => DataFileSchema.parse(validDataFile)).not.toThrow();
    });

    it('should validate data file with manual assets', () => {
      const validDataFile = {
        version: '1.0.0',
        years: {
          '2026': {
            transactions: [],
            budgets: [],
            manualAssets: [
              {
                id: 'asset-1',
                name: 'House',
                type: AssetType.REAL_ESTATE,
                value: 500000,
                currencyCode: 'USD',
                date: getDateString(),
                createdAt: getDateTimeString(),
                updatedAt: getDateTimeString(),
              },
            ],
          },
        },
        accounts: [],
        categories: [],
        transactionTypes: [],
        archivedYears: [],
        lastModified: getDateTimeString(),
      };
      expect(() => DataFileSchema.parse(validDataFile)).not.toThrow();
    });

    it('should reject data file with missing version', () => {
      const invalidDataFile = {
        years: {},
        accounts: [],
        categories: [],
        transactionTypes: [],
        archivedYears: [],
        lastModified: new Date().toISOString(),
      };
      expect(() => DataFileSchema.parse(invalidDataFile)).toThrow();
    });

    it('should accept data file with missing arrays and default to empty', () => {
      const dataFileWithMissingArrays = {
        version: '1.0.0',
        years: {},
        lastModified: new Date().toISOString(),
      };
      const result = DataFileSchema.parse(dataFileWithMissingArrays);
      expect(result.accounts).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.transactionTypes).toEqual([]);
      expect(result.archivedYears).toEqual([]);
    });

    it('should accept data file with null arrays and default to empty', () => {
      const dataFileWithNullArrays = {
        version: '1.0.0',
        years: {},
        accounts: null,
        categories: null,
        transactionTypes: null,
        archivedYears: null,
        lastModified: new Date().toISOString(),
      };
      const result = DataFileSchema.parse(dataFileWithNullArrays);
      expect(result.accounts).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.transactionTypes).toEqual([]);
      expect(result.archivedYears).toEqual([]);
    });
  });
});
