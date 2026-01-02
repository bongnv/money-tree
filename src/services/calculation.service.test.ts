import { calculationService } from './calculation.service';
import type { Transaction, Account } from '../types/models';
import { AccountType } from '../types/enums';

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

const incomeTransaction: Transaction = {
  id: 'txn-1',
  date: '2024-03-01T00:00:00.000Z',
  description: 'Salary',
  amount: 3000,
  transactionTypeId: 'type-income',
  toAccountId: 'acc-1',
  createdAt: '2024-03-01T00:00:00.000Z',
  updatedAt: '2024-03-01T00:00:00.000Z',
};

const expenseTransaction: Transaction = {
  id: 'txn-2',
  date: '2024-03-05T00:00:00.000Z',
  description: 'Groceries',
  amount: 200,
  transactionTypeId: 'type-expense',
  fromAccountId: 'acc-1',
  createdAt: '2024-03-05T00:00:00.000Z',
  updatedAt: '2024-03-05T00:00:00.000Z',
};

const transferTransaction: Transaction = {
  id: 'txn-3',
  date: '2024-03-10T00:00:00.000Z',
  description: 'Transfer to Savings',
  amount: 500,
  transactionTypeId: 'type-transfer',
  fromAccountId: 'acc-1',
  toAccountId: 'acc-2',
  createdAt: '2024-03-10T00:00:00.000Z',
  updatedAt: '2024-03-10T00:00:00.000Z',
};

describe('CalculationService', () => {
  describe('calculateAccountBalance', () => {
    it('should return initial balance with no transactions', () => {
      const balance = calculationService.calculateAccountBalance(mockAccount1, []);
      expect(balance).toBe(1000);
    });

    it('should add income to balance', () => {
      const balance = calculationService.calculateAccountBalance(mockAccount1, [
        incomeTransaction,
      ]);
      expect(balance).toBe(4000); // 1000 + 3000
    });

    it('should subtract expenses from balance', () => {
      const balance = calculationService.calculateAccountBalance(mockAccount1, [
        expenseTransaction,
      ]);
      expect(balance).toBe(800); // 1000 - 200
    });

    it('should handle transfers correctly', () => {
      const balance1 = calculationService.calculateAccountBalance(mockAccount1, [
        transferTransaction,
      ]);
      expect(balance1).toBe(500); // 1000 - 500

      const balance2 = calculationService.calculateAccountBalance(mockAccount2, [
        transferTransaction,
      ]);
      expect(balance2).toBe(5500); // 5000 + 500
    });

    it('should handle multiple transactions', () => {
      const balance = calculationService.calculateAccountBalance(mockAccount1, [
        incomeTransaction,
        expenseTransaction,
        transferTransaction,
      ]);
      expect(balance).toBe(3300); // 1000 + 3000 - 200 - 500
    });
  });

  describe('calculateAccountBalances', () => {
    it('should calculate balances for multiple accounts', () => {
      const balances = calculationService.calculateAccountBalances(
        [mockAccount1, mockAccount2],
        [incomeTransaction, expenseTransaction, transferTransaction]
      );

      expect(balances.get('acc-1')).toBe(3300);
      expect(balances.get('acc-2')).toBe(5500);
    });

    it('should return empty map for no accounts', () => {
      const balances = calculationService.calculateAccountBalances([], []);
      expect(balances.size).toBe(0);
    });
  });

  describe('calculateTotalIncome', () => {
    it('should sum all income transactions', () => {
      const total = calculationService.calculateTotalIncome([
        incomeTransaction,
        { ...incomeTransaction, id: 'txn-4', amount: 1000 },
      ]);
      expect(total).toBe(4000); // 3000 + 1000
    });

    it('should exclude non-income transactions', () => {
      const total = calculationService.calculateTotalIncome([
        incomeTransaction,
        expenseTransaction,
        transferTransaction,
      ]);
      expect(total).toBe(3000); // Only income
    });

    it('should return 0 for no income', () => {
      const total = calculationService.calculateTotalIncome([expenseTransaction]);
      expect(total).toBe(0);
    });
  });

  describe('calculateTotalExpenses', () => {
    it('should sum all expense transactions', () => {
      const total = calculationService.calculateTotalExpenses([
        expenseTransaction,
        { ...expenseTransaction, id: 'txn-4', amount: 150 },
      ]);
      expect(total).toBe(350); // 200 + 150
    });

    it('should exclude non-expense transactions', () => {
      const total = calculationService.calculateTotalExpenses([
        incomeTransaction,
        expenseTransaction,
        transferTransaction,
      ]);
      expect(total).toBe(200); // Only expense
    });

    it('should return 0 for no expenses', () => {
      const total = calculationService.calculateTotalExpenses([incomeTransaction]);
      expect(total).toBe(0);
    });
  });

  describe('calculateTotalTransfers', () => {
    it('should sum all transfer transactions', () => {
      const total = calculationService.calculateTotalTransfers([
        transferTransaction,
        { ...transferTransaction, id: 'txn-4', amount: 300 },
      ]);
      expect(total).toBe(800); // 500 + 300
    });

    it('should exclude non-transfer transactions', () => {
      const total = calculationService.calculateTotalTransfers([
        incomeTransaction,
        expenseTransaction,
        transferTransaction,
      ]);
      expect(total).toBe(500); // Only transfer
    });

    it('should return 0 for no transfers', () => {
      const total = calculationService.calculateTotalTransfers([incomeTransaction]);
      expect(total).toBe(0);
    });
  });

  describe('calculateNetIncome', () => {
    it('should calculate net income correctly', () => {
      const net = calculationService.calculateNetIncome([
        incomeTransaction,
        expenseTransaction,
      ]);
      expect(net).toBe(2800); // 3000 - 200
    });

    it('should handle negative net income', () => {
      const net = calculationService.calculateNetIncome([
        { ...incomeTransaction, amount: 100 },
        expenseTransaction,
      ]);
      expect(net).toBe(-100); // 100 - 200
    });

    it('should exclude transfers', () => {
      const net = calculationService.calculateNetIncome([
        incomeTransaction,
        expenseTransaction,
        transferTransaction,
      ]);
      expect(net).toBe(2800); // 3000 - 200 (transfer not counted)
    });
  });

  describe('calculateTotalByType', () => {
    it('should sum transactions by type', () => {
      const total = calculationService.calculateTotalByType('type-expense', [
        expenseTransaction,
        { ...expenseTransaction, id: 'txn-4', amount: 150 },
        incomeTransaction,
      ]);
      expect(total).toBe(350); // 200 + 150
    });

    it('should return 0 for type with no transactions', () => {
      const total = calculationService.calculateTotalByType('type-nonexistent', [
        expenseTransaction,
      ]);
      expect(total).toBe(0);
    });
  });

  describe('calculateTotalByCategory', () => {
    it('should sum transactions by category', () => {
      const total = calculationService.calculateTotalByCategory(
        'cat-1',
        [
          expenseTransaction,
          { ...expenseTransaction, id: 'txn-4', transactionTypeId: 'type-expense2', amount: 150 },
          incomeTransaction,
        ],
        ['type-expense', 'type-expense2']
      );
      expect(total).toBe(350); // 200 + 150
    });

    it('should return 0 for category with no transactions', () => {
      const total = calculationService.calculateTotalByCategory(
        'cat-1',
        [incomeTransaction],
        ['type-expense']
      );
      expect(total).toBe(0);
    });
  });

  describe('groupByTypeWithTotals', () => {
    it('should group transactions by type', () => {
      const totals = calculationService.groupByTypeWithTotals([
        incomeTransaction,
        expenseTransaction,
        { ...expenseTransaction, id: 'txn-4', amount: 150 },
      ]);

      expect(totals.get('type-income')).toBe(3000);
      expect(totals.get('type-expense')).toBe(350); // 200 + 150
    });

    it('should return empty map for no transactions', () => {
      const totals = calculationService.groupByTypeWithTotals([]);
      expect(totals.size).toBe(0);
    });
  });

  describe('calculateRunningBalance', () => {
    it('should calculate running balance over time', () => {
      const balances = calculationService.calculateRunningBalance(mockAccount1, [
        incomeTransaction,
        expenseTransaction,
        transferTransaction,
      ]);

      expect(balances).toHaveLength(4); // Initial + 3 transactions
      expect(balances[0]).toEqual({
        date: mockAccount1.createdAt,
        balance: 1000,
      });
      expect(balances[1]).toEqual({
        date: incomeTransaction.date,
        balance: 4000,
      });
      expect(balances[2]).toEqual({
        date: expenseTransaction.date,
        balance: 3800,
      });
      expect(balances[3]).toEqual({
        date: transferTransaction.date,
        balance: 3300,
      });
    });

    it('should return only initial balance with no transactions', () => {
      const balances = calculationService.calculateRunningBalance(mockAccount1, []);

      expect(balances).toHaveLength(1);
      expect(balances[0]).toEqual({
        date: mockAccount1.createdAt,
        balance: 1000,
      });
    });

    it('should only include transactions for the account', () => {
      const balances = calculationService.calculateRunningBalance(mockAccount1, [
        incomeTransaction, // acc-1
        { ...expenseTransaction, fromAccountId: 'acc-2' }, // acc-2, should be excluded
      ]);

      expect(balances).toHaveLength(2); // Initial + 1 transaction
      expect(balances[1].balance).toBe(4000); // Only income counted
    });
  });
});
