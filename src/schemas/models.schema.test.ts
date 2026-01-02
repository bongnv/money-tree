import {
  CurrencySchema,
  AccountSchema,
  CategorySchema,
  TransactionTypeSchema,
  TransactionSchema,
  BudgetSchema,
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
        id: 'usd',
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        decimalPlaces: 2,
      };
      expect(() => CurrencySchema.parse(validCurrency)).not.toThrow();
    });

    it('should reject currency with missing fields', () => {
      const invalidCurrency = {
        id: 'usd',
        code: 'USD',
        // missing symbol, name, decimalPlaces
      };
      expect(() => CurrencySchema.parse(invalidCurrency)).toThrow();
    });

    it('should reject currency with invalid decimalPlaces', () => {
      const invalidCurrency = {
        id: 'usd',
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
        currencyId: 'usd',
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
        currencyId: 'usd',
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
        currencyId: 'usd',
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
        group: Group.EXPENSE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => CategorySchema.parse(validCategory)).not.toThrow();
    });

    it('should validate category with parentId', () => {
      const validCategory = {
        id: 'cat2',
        name: 'Groceries',
        group: Group.EXPENSE,
        parentId: 'cat1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => CategorySchema.parse(validCategory)).not.toThrow();
    });

    it('should reject category with invalid group', () => {
      const invalidCategory = {
        id: 'cat1',
        name: 'Food',
        group: 'invalid_group',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => CategorySchema.parse(invalidCategory)).toThrow();
    });
  });

  describe('TransactionTypeSchema', () => {
    it('should validate a valid transaction type', () => {
      const validTransactionType = {
        id: 'tt1',
        name: 'Grocery Shopping',
        categoryId: 'cat1',
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
        description: 'Weekly grocery expenses',
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
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      expect(() => BudgetSchema.parse(invalidBudget)).toThrow();
    });
  });

  describe('ManualAssetSchema', () => {
    it('should validate a valid manual asset', () => {
      const validAsset = {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        value: 500000,
        currencyId: 'usd',
        date: getDateString(),
        notes: 'Primary residence',
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
        value: 25000,
        currencyId: 'usd',
        date: getDateString(),
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(validAsset)).not.toThrow();
    });

    it('should reject asset with missing id', () => {
      const invalidAsset = {
        name: 'House',
        type: AssetType.REAL_ESTATE,
        value: 500000,
        currencyId: 'usd',
        date: getDateString(),
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
        value: 500000,
        currencyId: 'usd',
        date: getDateString(),
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
        value: 500000,
        currencyId: 'usd',
        date: getDateString(),
        createdAt: getDateTimeString(),
        updatedAt: getDateTimeString(),
      };
      expect(() => ManualAssetSchema.parse(invalidAsset)).toThrow();
    });

    it('should validate all asset types', () => {
      Object.values(AssetType).forEach(type => {
        const asset = {
          id: 'asset-1',
          name: 'Test Asset',
          type,
          value: 10000,
          currencyId: 'usd',
          date: getDateString(),
          createdAt: getDateTimeString(),
          updatedAt: getDateTimeString(),
        };
        expect(() => ManualAssetSchema.parse(asset)).not.toThrow();
      });
    });
  });

  describe('DataFileSchema', () => {
    it('should validate a valid data file', () => {
      const validDataFile = {
        version: '1.0.0',
        year: 2026,
        accounts: [],
        categories: [],
        transactionTypes: [],
        transactions: [],
        budgets: [],
        manualAssets: [],
        lastModified: new Date().toISOString(),
      };
      expect(() => DataFileSchema.parse(validDataFile)).not.toThrow();
    });

    it('should validate data file with manual assets', () => {
      const validDataFile = {
        version: '1.0.0',
        year: 2026,
        accounts: [],
        categories: [],
        transactionTypes: [],
        transactions: [],
        budgets: [],
        manualAssets: [
          {
            id: 'asset-1',
            name: 'House',
            type: AssetType.REAL_ESTATE,
            value: 500000,
            currencyId: 'usd',
            date: getDateString(),
            createdAt: getDateTimeString(),
            updatedAt: getDateTimeString(),
          },
        ],
        lastModified: getDateTimeString(),
      };
      expect(() => DataFileSchema.parse(validDataFile)).not.toThrow();
    });

    it('should reject data file with invalid year', () => {
      const invalidDataFile = {
        version: '1.0.0',
        year: 1800, // Too old
        accounts: [],
        categories: [],
        transactionTypes: [],
        transactions: [],
        budgets: [],
        manualAssets: [],
        lastModified: new Date().toISOString(),
      };
      expect(() => DataFileSchema.parse(invalidDataFile)).toThrow();
    });

    it('should reject data file with missing version', () => {
      const invalidDataFile = {
        year: 2026,
        accounts: [],
        categories: [],
        transactionTypes: [],
        transactions: [],
        budgets: [],
        manualAssets: [],
        lastModified: new Date().toISOString(),
      };
      expect(() => DataFileSchema.parse(invalidDataFile)).toThrow();
    });

    it('should accept data file with missing arrays and default to empty', () => {
      const dataFileWithMissingArrays = {
        version: '1.0.0',
        year: 2026,
        lastModified: new Date().toISOString(),
      };
      const result = DataFileSchema.parse(dataFileWithMissingArrays);
      expect(result.accounts).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.transactionTypes).toEqual([]);
      expect(result.transactions).toEqual([]);
      expect(result.budgets).toEqual([]);
      expect(result.manualAssets).toEqual([]);
    });

    it('should accept data file with null arrays and default to empty', () => {
      const dataFileWithNullArrays = {
        version: '1.0.0',
        year: 2026,
        accounts: null,
        categories: null,
        transactionTypes: null,
        transactions: null,
        budgets: null,
        manualAssets: null,
        lastModified: new Date().toISOString(),
      };
      const result = DataFileSchema.parse(dataFileWithNullArrays);
      expect(result.accounts).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.transactionTypes).toEqual([]);
      expect(result.transactions).toEqual([]);
      expect(result.budgets).toEqual([]);
      expect(result.manualAssets).toEqual([]);
    });
  });
});


