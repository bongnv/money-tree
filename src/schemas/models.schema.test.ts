import {
  CurrencySchema,
  AccountSchema,
  CategorySchema,
  TransactionTypeSchema,
  TransactionSchema,
  BudgetItemSchema,
  BudgetSchema,
  DataFileSchema,
} from './models.schema';
import { AccountType, BudgetPeriod, Group } from '../types/enums';

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
        date: new Date().toISOString(),
        description: 'Grocery store',
        amount: 50.0,
        transactionTypeId: 'tt1',
        fromAccountId: 'acc1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => TransactionSchema.parse(validTransaction)).not.toThrow();
    });

    it('should validate a valid income transaction', () => {
      const validTransaction = {
        id: 'tx2',
        date: new Date().toISOString(),
        description: 'Salary',
        amount: 3000.0,
        transactionTypeId: 'tt2',
        toAccountId: 'acc1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => TransactionSchema.parse(validTransaction)).not.toThrow();
    });

    it('should validate a valid transfer transaction', () => {
      const validTransaction = {
        id: 'tx3',
        date: new Date().toISOString(),
        description: 'Transfer to savings',
        amount: 500.0,
        transactionTypeId: 'tt3',
        fromAccountId: 'acc1',
        toAccountId: 'acc2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

  describe('BudgetItemSchema', () => {
    it('should validate a valid budget item', () => {
      const validBudgetItem = {
        id: 'bi1',
        transactionTypeId: 'tt1',
        plannedAmount: 200.0,
      };
      expect(() => BudgetItemSchema.parse(validBudgetItem)).not.toThrow();
    });

    it('should validate budget item with notes', () => {
      const validBudgetItem = {
        id: 'bi1',
        transactionTypeId: 'tt1',
        plannedAmount: 200.0,
        notes: 'Monthly grocery budget',
      };
      expect(() => BudgetItemSchema.parse(validBudgetItem)).not.toThrow();
    });

    it('should reject budget item with negative amount', () => {
      const invalidBudgetItem = {
        id: 'bi1',
        transactionTypeId: 'tt1',
        plannedAmount: -200.0,
      };
      expect(() => BudgetItemSchema.parse(invalidBudgetItem)).toThrow();
    });
  });

  describe('BudgetSchema', () => {
    it('should validate a valid budget', () => {
      const validBudget = {
        id: 'b1',
        name: 'January 2026 Budget',
        period: BudgetPeriod.MONTHLY,
        startDate: new Date('2026-01-01').toISOString(),
        endDate: new Date('2026-01-31').toISOString(),
        items: [
          {
            id: 'bi1',
            transactionTypeId: 'tt1',
            plannedAmount: 200.0,
          },
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => BudgetSchema.parse(validBudget)).not.toThrow();
    });

    it('should validate budget with empty items', () => {
      const validBudget = {
        id: 'b1',
        name: 'January 2026 Budget',
        period: BudgetPeriod.MONTHLY,
        startDate: new Date('2026-01-01').toISOString(),
        endDate: new Date('2026-01-31').toISOString(),
        items: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => BudgetSchema.parse(validBudget)).not.toThrow();
    });

    it('should reject budget with invalid period', () => {
      const invalidBudget = {
        id: 'b1',
        name: 'January 2026 Budget',
        period: 'invalid_period',
        startDate: new Date('2026-01-01').toISOString(),
        endDate: new Date('2026-01-31').toISOString(),
        items: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => BudgetSchema.parse(invalidBudget)).toThrow();
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
        lastModified: new Date().toISOString(),
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
        lastModified: new Date().toISOString(),
      };
      expect(() => DataFileSchema.parse(invalidDataFile)).toThrow();
    });
  });
});

