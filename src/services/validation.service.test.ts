import { validationService } from './validation.service';
import type { Transaction, Account, TransactionType, Category } from '../types/models';
import { Group, AccountType } from '../types/enums';

const mockAccount1: Account = {
  id: 'acc-1',
  name: 'Checking',
  type: AccountType.BANK_ACCOUNT,
  currencyId: 'usd',
  initialBalance: 1000,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockAccount2: Account = {
  id: 'acc-2',
  name: 'Savings',
  type: AccountType.BANK_ACCOUNT,
  currencyId: 'usd',
  initialBalance: 5000,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const inactiveAccount: Account = {
  ...mockAccount1,
  id: 'acc-3',
  name: 'Closed Account',
  isActive: false,
};

const expenseCategory: Category = {
  id: 'cat-1',
  name: 'Food',
  group: Group.EXPENSE,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const incomeCategory: Category = {
  id: 'cat-2',
  name: 'Salary',
  group: Group.INCOME,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const transferCategory: Category = {
  id: 'cat-3',
  name: 'Account Transfer',
  group: Group.TRANSFER,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const investmentCategory: Category = {
  id: 'cat-4',
  name: 'Stock Purchase',
  group: Group.INVESTMENT,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const expenseType: TransactionType = {
  id: 'type-1',
  name: 'Groceries',
  categoryId: 'cat-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('ValidationService', () => {
  describe('validateTransaction', () => {
    it('should validate required fields', () => {
      const transaction: Partial<Transaction> = {};

      const errors = validationService.validateTransaction(transaction);

      expect(errors).toHaveLength(4);
      expect(errors.find((e) => e.field === 'date')).toBeDefined();
      expect(errors.find((e) => e.field === 'description')).toBeDefined();
      expect(errors.find((e) => e.field === 'amount')).toBeDefined();
      expect(errors.find((e) => e.field === 'transactionTypeId')).toBeDefined();
    });

    it('should validate amount is positive', () => {
      const transaction: Partial<Transaction> = {
        date: '2024-03-15T00:00:00.000Z',
        description: 'Test',
        amount: 0,
        transactionTypeId: 'type-1',
      };

      const errors = validationService.validateTransaction(transaction);

      expect(errors.find((e) => e.field === 'amount')).toBeDefined();
    });

    it('should validate description is not empty', () => {
      const transaction: Partial<Transaction> = {
        date: '2024-03-15T00:00:00.000Z',
        description: '   ',
        amount: 100,
        transactionTypeId: 'type-1',
      };

      const errors = validationService.validateTransaction(transaction);

      expect(errors.find((e) => e.field === 'description')).toBeDefined();
    });

    describe('Expense validation', () => {
      it('should require fromAccount for expenses', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Groceries',
          amount: 50,
          transactionTypeId: 'type-1',
        };

        const errors = validationService.validateTransaction(
          transaction,
          expenseType,
          expenseCategory
        );

        expect(errors.find((e) => e.field === 'fromAccountId')).toBeDefined();
      });

      it('should not allow toAccount for expenses', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Groceries',
          amount: 50,
          transactionTypeId: 'type-1',
          fromAccountId: 'acc-1',
          toAccountId: 'acc-2',
        };

        const errors = validationService.validateTransaction(
          transaction,
          expenseType,
          expenseCategory
        );

        expect(errors.find((e) => e.field === 'toAccountId')).toBeDefined();
      });

      it('should validate expense with valid fromAccount', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Groceries',
          amount: 50,
          transactionTypeId: 'type-1',
          fromAccountId: 'acc-1',
        };

        const errors = validationService.validateTransaction(
          transaction,
          expenseType,
          expenseCategory,
          mockAccount1
        );

        expect(errors).toHaveLength(0);
      });
    });

    describe('Income validation', () => {
      it('should require toAccount for income', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Salary',
          amount: 5000,
          transactionTypeId: 'type-2',
        };

        const incomeType: TransactionType = {
          id: 'type-2',
          name: 'Monthly Salary',
          categoryId: 'cat-2',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(
          transaction,
          incomeType,
          incomeCategory
        );

        expect(errors.find((e) => e.field === 'toAccountId')).toBeDefined();
      });

      it('should not allow fromAccount for income', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Salary',
          amount: 5000,
          transactionTypeId: 'type-2',
          fromAccountId: 'acc-1',
          toAccountId: 'acc-2',
        };

        const incomeType: TransactionType = {
          id: 'type-2',
          name: 'Monthly Salary',
          categoryId: 'cat-2',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(
          transaction,
          incomeType,
          incomeCategory
        );

        expect(errors.find((e) => e.field === 'fromAccountId')).toBeDefined();
      });
    });

    describe('Transfer validation', () => {
      it('should require both accounts for transfer', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Transfer',
          amount: 500,
          transactionTypeId: 'type-3',
        };

        const transferType: TransactionType = {
          id: 'type-3',
          name: 'Between Accounts',
          categoryId: 'cat-3',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(
          transaction,
          transferType,
          transferCategory
        );

        expect(errors.find((e) => e.field === 'fromAccountId')).toBeDefined();
        expect(errors.find((e) => e.field === 'toAccountId')).toBeDefined();
      });

      it('should not allow same account for transfer', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Transfer',
          amount: 500,
          transactionTypeId: 'type-3',
          fromAccountId: 'acc-1',
          toAccountId: 'acc-1',
        };

        const transferType: TransactionType = {
          id: 'type-3',
          name: 'Between Accounts',
          categoryId: 'cat-3',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(
          transaction,
          transferType,
          transferCategory,
          mockAccount1,
          mockAccount1
        );

        expect(errors.find((e) => e.field === 'toAccountId')).toBeDefined();
      });
    });

    describe('Investment validation', () => {
      it('should require toAccount for investment', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Buy stocks',
          amount: 1000,
          transactionTypeId: 'type-4',
        };

        const investmentType: TransactionType = {
          id: 'type-4',
          name: 'Stock Purchase',
          categoryId: 'cat-4',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(
          transaction,
          investmentType,
          investmentCategory
        );

        expect(errors.find((e) => e.field === 'toAccountId')).toBeDefined();
      });

      it('should not allow fromAccount for investment', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Buy stocks',
          amount: 1000,
          transactionTypeId: 'type-4',
          fromAccountId: 'acc-1',
          toAccountId: 'acc-2',
        };

        const investmentType: TransactionType = {
          id: 'type-4',
          name: 'Stock Purchase',
          categoryId: 'cat-4',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(
          transaction,
          investmentType,
          investmentCategory
        );

        expect(errors.find((e) => e.field === 'fromAccountId')).toBeDefined();
      });
    });

    describe('Account status validation', () => {
      it('should not allow inactive fromAccount', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Test',
          amount: 50,
          transactionTypeId: 'type-1',
          fromAccountId: 'acc-3',
        };

        const errors = validationService.validateTransaction(
          transaction,
          expenseType,
          expenseCategory,
          inactiveAccount
        );

        expect(errors.find((e) => e.field === 'fromAccountId')).toBeDefined();
      });

      it('should not allow inactive toAccount', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Test',
          amount: 50,
          transactionTypeId: 'type-2',
          toAccountId: 'acc-3',
        };

        const incomeType: TransactionType = {
          id: 'type-2',
          name: 'Salary',
          categoryId: 'cat-2',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(
          transaction,
          incomeType,
          incomeCategory,
          undefined,
          inactiveAccount
        );

        expect(errors.find((e) => e.field === 'toAccountId')).toBeDefined();
      });
    });
  });

  describe('canDeleteAccount', () => {
    it('should allow deletion if account has no transactions', () => {
      const transactions: Transaction[] = [];

      const result = validationService.canDeleteAccount('acc-1', transactions);

      expect(result).toBe(true);
    });

    it('should not allow deletion if account is fromAccount', () => {
      const transactions: Transaction[] = [
        {
          id: 'txn-1',
          date: '2024-03-15T00:00:00.000Z',
          description: 'Test',
          amount: 50,
          transactionTypeId: 'type-1',
          fromAccountId: 'acc-1',
          createdAt: '2024-03-15T00:00:00.000Z',
          updatedAt: '2024-03-15T00:00:00.000Z',
        },
      ];

      const result = validationService.canDeleteAccount('acc-1', transactions);

      expect(result).toBe(false);
    });

    it('should not allow deletion if account is toAccount', () => {
      const transactions: Transaction[] = [
        {
          id: 'txn-1',
          date: '2024-03-15T00:00:00.000Z',
          description: 'Test',
          amount: 50,
          transactionTypeId: 'type-1',
          toAccountId: 'acc-1',
          createdAt: '2024-03-15T00:00:00.000Z',
          updatedAt: '2024-03-15T00:00:00.000Z',
        },
      ];

      const result = validationService.canDeleteAccount('acc-1', transactions);

      expect(result).toBe(false);
    });
  });

  describe('canDeleteTransactionType', () => {
    it('should allow deletion if no transactions use the type', () => {
      const transactions: Transaction[] = [];

      const result = validationService.canDeleteTransactionType('type-1', transactions);

      expect(result).toBe(true);
    });

    it('should not allow deletion if transactions use the type', () => {
      const transactions: Transaction[] = [
        {
          id: 'txn-1',
          date: '2024-03-15T00:00:00.000Z',
          description: 'Test',
          amount: 50,
          transactionTypeId: 'type-1',
          fromAccountId: 'acc-1',
          createdAt: '2024-03-15T00:00:00.000Z',
          updatedAt: '2024-03-15T00:00:00.000Z',
        },
      ];

      const result = validationService.canDeleteTransactionType('type-1', transactions);

      expect(result).toBe(false);
    });
  });

  describe('canDeleteCategory', () => {
    it('should allow deletion if no transaction types use the category', () => {
      const transactionTypes: TransactionType[] = [];

      const result = validationService.canDeleteCategory('cat-1', transactionTypes);

      expect(result).toBe(true);
    });

    it('should not allow deletion if transaction types use the category', () => {
      const transactionTypes: TransactionType[] = [
        {
          id: 'type-1',
          name: 'Groceries',
          categoryId: 'cat-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      const result = validationService.canDeleteCategory('cat-1', transactionTypes);

      expect(result).toBe(false);
    });
  });
});
