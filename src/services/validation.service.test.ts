import { Group, AccountType, CurrencyCode } from '@/types/enums';
import type { Transaction, Account, TransactionType } from '@/types/models';
import { validationService } from './validation.service';

const mockAccount1: Account = {
  id: 'acc-1',
  name: 'Checking',
  type: AccountType.BANK_ACCOUNT,
  currencyCode: CurrencyCode.USD,
  initialBalance: 1000,
  isActive: true,
  isDeleted: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const inactiveAccount: Account = {
  ...mockAccount1,
  id: 'acc-3',
  name: 'Closed Account',
  isActive: false,
};

const expenseType: TransactionType = {
  id: 'type-1',
  name: 'Groceries',
  categoryId: 'cat-1',
  group: Group.EXPENSE,
  isActive: true,
  isDeleted: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('ValidationService', () => {
  describe('validateTransaction', () => {
    it('should validate required fields', () => {
      const transaction: Partial<Transaction> = {};

      const errors = validationService.validateTransaction(transaction);

      expect(errors).toHaveLength(3);
      expect(errors.find((e) => e.field === 'date')).toBeDefined();
      expect(errors.find((e) => e.field === 'amount')).toBeDefined();
      expect(errors.find((e) => e.field === 'transactionTypeId')).toBeDefined();
    });

    it('should allow negative amounts (for refunds)', () => {
      const transaction: Partial<Transaction> = {
        date: '2024-03-15T00:00:00.000Z',
        description: 'Refund',
        amount: -50,
        transactionTypeId: 'type-1',
      };

      const errors = validationService.validateTransaction(transaction);

      expect(errors.find((e) => e.field === 'amount')).toBeUndefined();
    });

    describe('Expense validation', () => {
      it('should require fromAccount for expenses', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Groceries',
          amount: 50,
          transactionTypeId: 'type-1',
        };

        const errors = validationService.validateTransaction(transaction, expenseType);

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

        const errors = validationService.validateTransaction(transaction, expenseType);

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
          group: Group.INCOME,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(transaction, incomeType);

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
          group: Group.INCOME,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(transaction, incomeType);

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
          group: Group.TRANSFER,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(transaction, transferType);

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
          group: Group.TRANSFER,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(
          transaction,
          transferType,
          mockAccount1,
          mockAccount1
        );

        expect(errors.find((e) => e.field === 'toAccountId')).toBeDefined();
      });
    });

    describe('Asset Purchase validation', () => {
      it('should require toAsset for asset purchase', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Buy stocks',
          amount: 1000,
          transactionTypeId: 'type-4',
          fromAccountId: 'acc-1',
        };

        const assetPurchaseType: TransactionType = {
          id: 'type-4',
          name: 'Stock Purchase',
          categoryId: 'cat-4',
          group: Group.ASSET_PURCHASE,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(transaction, assetPurchaseType);

        expect(errors.find((e) => e.field === 'toAssetId')).toBeDefined();
      });

      it('should require fromAccount for asset purchase', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Buy stocks',
          amount: 1000,
          transactionTypeId: 'type-4',
          toAssetId: 'asset-1',
        };

        const assetPurchaseType: TransactionType = {
          id: 'type-4',
          name: 'Stock Purchase',
          categoryId: 'cat-4',
          group: Group.ASSET_PURCHASE,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(transaction, assetPurchaseType);

        expect(errors.find((e) => e.field === 'fromAccountId')).toBeDefined();
      });

      it('should validate asset purchase: fromAccount + toAsset', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Buy stocks',
          amount: 1000,
          transactionTypeId: 'type-4',
          fromAccountId: 'acc-1',
          toAssetId: 'asset-1',
        };

        const assetPurchaseType: TransactionType = {
          id: 'type-4',
          name: 'Stock Purchase',
          categoryId: 'cat-4',
          group: Group.ASSET_PURCHASE,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(
          transaction,
          assetPurchaseType,
          mockAccount1,
          undefined
        );

        expect(errors.length).toBe(0);
      });

      it('should not allow toAccount for asset purchase', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Buy stocks',
          amount: 1000,
          transactionTypeId: 'type-4',
          fromAccountId: 'acc-1',
          toAssetId: 'asset-1',
          toAccountId: 'acc-2',
        };

        const assetPurchaseType: TransactionType = {
          id: 'type-4',
          name: 'Stock Purchase',
          categoryId: 'cat-4',
          group: Group.ASSET_PURCHASE,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(transaction, assetPurchaseType);

        expect(errors.find((e) => e.field === 'toAccountId')).toBeDefined();
      });
    });

    describe('Asset Sale validation', () => {
      it('should require fromAsset for asset sale', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Sell stocks',
          amount: 1000,
          transactionTypeId: 'type-5',
          toAccountId: 'acc-1',
        };

        const assetSaleType: TransactionType = {
          id: 'type-5',
          name: 'Stock Sale',
          categoryId: 'cat-4',
          group: Group.ASSET_SALE,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(transaction, assetSaleType);

        expect(errors.find((e) => e.field === 'fromAssetId')).toBeDefined();
      });

      it('should require toAccount for asset sale', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Sell stocks',
          amount: 1000,
          transactionTypeId: 'type-5',
          fromAssetId: 'asset-1',
        };

        const assetSaleType: TransactionType = {
          id: 'type-5',
          name: 'Stock Sale',
          categoryId: 'cat-4',
          group: Group.ASSET_SALE,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(transaction, assetSaleType);

        expect(errors.find((e) => e.field === 'toAccountId')).toBeDefined();
      });

      it('should validate asset sale: fromAsset + toAccount', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Sell stocks',
          amount: 1000,
          transactionTypeId: 'type-5',
          fromAssetId: 'asset-1',
          toAccountId: 'acc-1',
        };

        const assetSaleType: TransactionType = {
          id: 'type-5',
          name: 'Stock Sale',
          categoryId: 'cat-4',
          group: Group.ASSET_SALE,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(
          transaction,
          assetSaleType,
          undefined,
          mockAccount1
        );

        expect(errors.length).toBe(0);
      });

      it('should not allow fromAccount for asset sale', () => {
        const transaction: Partial<Transaction> = {
          date: '2024-03-15T00:00:00.000Z',
          description: 'Sell stocks',
          amount: 1000,
          transactionTypeId: 'type-5',
          fromAssetId: 'asset-1',
          fromAccountId: 'acc-1',
          toAccountId: 'acc-2',
        };

        const assetSaleType: TransactionType = {
          id: 'type-5',
          name: 'Stock Sale',
          categoryId: 'cat-4',
          group: Group.ASSET_SALE,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(transaction, assetSaleType);

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
          group: Group.INCOME,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const errors = validationService.validateTransaction(
          transaction,
          incomeType,
          undefined,
          inactiveAccount
        );

        expect(errors.find((e) => e.field === 'toAccountId')).toBeDefined();
      });
    });
  });
});
