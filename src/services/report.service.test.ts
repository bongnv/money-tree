import { reportService } from './report.service';
import type { Account, ManualAsset, Transaction, TransactionType, Category } from '../types/models';
import { AccountType, AssetType, Group } from '../types/enums';

describe('ReportService', () => {
  // Mock data
  const mockAccounts: Account[] = [
    {
      id: 'acc1',
      name: 'Checking Account',
      type: AccountType.BANK_ACCOUNT,
      currencyId: 'usd',
      initialBalance: 1000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'acc2',
      name: 'Credit Card',
      type: AccountType.CREDIT_CARD,
      currencyId: 'usd',
      initialBalance: 0,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'acc3',
      name: 'Savings Account',
      type: AccountType.BANK_ACCOUNT,
      currencyId: 'usd',
      initialBalance: 5000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockManualAssets: ManualAsset[] = [
    {
      id: 'asset1',
      name: 'House',
      type: AssetType.REAL_ESTATE,
      value: 500000,
      currencyId: 'usd',
      date: '2024-01-01',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'asset2',
      name: 'Mortgage',
      type: AssetType.LIABILITY,
      value: -300000,
      currencyId: 'usd',
      date: '2024-01-01',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx1',
      date: '2024-01-15',
      description: 'Income',
      amount: 3000,
      transactionTypeId: 'type1',
      toAccountId: 'acc1',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: 'tx2',
      date: '2024-01-20',
      description: 'Expense',
      amount: 500,
      transactionTypeId: 'type2',
      fromAccountId: 'acc1',
      createdAt: '2024-01-20T00:00:00.000Z',
      updatedAt: '2024-01-20T00:00:00.000Z',
    },
    {
      id: 'tx3',
      date: '2024-01-25',
      description: 'Credit Card Expense',
      amount: 200,
      transactionTypeId: 'type3',
      fromAccountId: 'acc2',
      createdAt: '2024-01-25T00:00:00.000Z',
      updatedAt: '2024-01-25T00:00:00.000Z',
    },
  ];

  describe('calculateBalanceSheet', () => {
    it('should calculate balance sheet correctly', () => {
      const result = reportService.calculateBalanceSheet(
        mockAccounts,
        mockManualAssets,
        mockTransactions
      );

      expect(result.totalAssets).toBeGreaterThan(0);
      expect(result.totalLiabilities).toBeGreaterThan(0);
      expect(result.netWorth).toBe(result.totalAssets - result.totalLiabilities);
      expect(result.assets).toBeInstanceOf(Array);
      expect(result.liabilities).toBeInstanceOf(Array);
    });

    it('should filter transactions by date', () => {
      const result = reportService.calculateBalanceSheet(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '2024-01-16'
      );

      // Should only include transactions up to 2024-01-16 (first transaction)
      expect(result.totalAssets).toBeDefined();
    });

    it('should handle empty accounts and assets', () => {
      const result = reportService.calculateBalanceSheet([], [], []);

      expect(result.totalAssets).toBe(0);
      expect(result.totalLiabilities).toBe(0);
      expect(result.netWorth).toBe(0);
      expect(result.assets).toHaveLength(0);
      expect(result.liabilities).toHaveLength(0);
    });

    it('should group assets correctly by type', () => {
      const result = reportService.calculateBalanceSheet(
        mockAccounts,
        mockManualAssets,
        mockTransactions
      );

      expect(result.assets.length).toBeGreaterThan(0);
      expect(result.assets.every((group) => group.items.length > 0)).toBe(true);
    });

    it('should group liabilities correctly', () => {
      const result = reportService.calculateBalanceSheet(
        mockAccounts,
        mockManualAssets,
        mockTransactions
      );

      expect(result.liabilities.length).toBeGreaterThan(0);
    });

    it('should calculate net worth as assets minus liabilities', () => {
      const result = reportService.calculateBalanceSheet(
        mockAccounts,
        mockManualAssets,
        mockTransactions
      );

      expect(result.netWorth).toBe(result.totalAssets - result.totalLiabilities);
    });
  });

  describe('calculateNetWorthTrend', () => {
    it('should calculate trend points over time', () => {
      const startDate = '2024-01-01';
      const endDate = '2024-03-01';

      const trend = reportService.calculateNetWorthTrend(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        startDate,
        endDate,
        30
      );

      expect(trend.length).toBeGreaterThan(0);
      expect(trend[0]).toHaveProperty('date');
      expect(trend[0]).toHaveProperty('netWorth');
      expect(trend[0]).toHaveProperty('assets');
      expect(trend[0]).toHaveProperty('liabilities');
    });

    it('should respect interval parameter', () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const trend = reportService.calculateNetWorthTrend(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        startDate,
        endDate,
        10
      );

      // With 10-day intervals, should have about 3-4 points in a month
      expect(trend.length).toBeGreaterThanOrEqual(3);
    });

    it('should return empty array for invalid date range', () => {
      const startDate = '2024-02-01';
      const endDate = '2024-01-01'; // End before start

      const trend = reportService.calculateNetWorthTrend(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        startDate,
        endDate
      );

      expect(trend).toHaveLength(0);
    });
  });

  describe('calculateMonthOverMonthComparison', () => {
    it('should compare current month to previous month', () => {
      const result = reportService.calculateMonthOverMonthComparison(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '2024-02-15'
      );

      expect(result.current).toBeDefined();
      expect(result.previous).toBeDefined();
      expect(result.change).toBeDefined();
      expect(result.changePercent).toBeDefined();
    });

    it('should calculate change correctly', () => {
      const result = reportService.calculateMonthOverMonthComparison(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '2024-02-15'
      );

      expect(result.change).toBe(result.current.netWorth - result.previous.netWorth);
    });

    it('should calculate change percent correctly', () => {
      const result = reportService.calculateMonthOverMonthComparison(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '2024-02-15'
      );

      if (result.previous.netWorth !== 0) {
        const expectedPercent = (result.change / result.previous.netWorth) * 100;
        expect(result.changePercent).toBeCloseTo(expectedPercent, 2);
      } else {
        expect(result.changePercent).toBe(0);
      }
    });
  });

  describe('calculateYearOverYearComparison', () => {
    it('should compare current year to previous year', () => {
      const result = reportService.calculateYearOverYearComparison(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '2025-01-15'
      );

      expect(result.current).toBeDefined();
      expect(result.previous).toBeDefined();
      expect(result.change).toBeDefined();
      expect(result.changePercent).toBeDefined();
    });

    it('should calculate change correctly', () => {
      const result = reportService.calculateYearOverYearComparison(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '2025-01-15'
      );

      expect(result.change).toBe(result.current.netWorth - result.previous.netWorth);
    });

    it('should handle zero previous net worth', () => {
      const emptyAccounts: Account[] = [];
      const emptyAssets: ManualAsset[] = [];

      const result = reportService.calculateYearOverYearComparison(
        emptyAccounts,
        emptyAssets,
        [],
        '2024-01-15'
      );

      expect(result.changePercent).toBe(0);
    });
  });

  describe('calculateCashFlow', () => {
    const mockCategories: Category[] = [
      {
        id: 'cat1',
        name: 'Salary',
        group: Group.INCOME,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cat2',
        name: 'Groceries',
        group: Group.EXPENSE,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cat3',
        name: 'Transfer',
        group: Group.TRANSFER,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockTypes: TransactionType[] = [
      {
        id: 'type1',
        name: 'Salary',
        categoryId: 'cat1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'type2',
        name: 'Groceries',
        categoryId: 'cat2',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'type3',
        name: 'Account Transfer',
        categoryId: 'cat3',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockCashFlowTransactions: Transaction[] = [
      {
        id: 'tx1',
        date: '2024-01-15',
        description: 'Salary',
        amount: 3000,
        transactionTypeId: 'type1',
        toAccountId: 'acc1',
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      },
      {
        id: 'tx2',
        date: '2024-01-20',
        description: 'Groceries',
        amount: 500,
        transactionTypeId: 'type2',
        fromAccountId: 'acc1',
        createdAt: '2024-01-20T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z',
      },
      {
        id: 'tx3',
        date: '2024-01-25',
        description: 'Transfer',
        amount: 200,
        transactionTypeId: 'type3',
        fromAccountId: 'acc1',
        toAccountId: 'acc3',
        createdAt: '2024-01-25T00:00:00.000Z',
        updatedAt: '2024-01-25T00:00:00.000Z',
      },
      {
        id: 'tx4',
        date: '2024-02-01',
        description: 'Out of range',
        amount: 1000,
        transactionTypeId: 'type2',
        fromAccountId: 'acc1',
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z',
      },
    ];

    it('should calculate cash flow correctly', () => {
      const result = reportService.calculateCashFlow(
        mockCashFlowTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31'
      );

      expect(result.totalIncome).toBe(3000);
      expect(result.totalExpenses).toBe(500);
      expect(result.netCashFlow).toBe(2500);
      expect(result.income).toHaveLength(1);
      expect(result.expenses).toHaveLength(1);
    });

    it('should exclude transfers from cash flow', () => {
      const result = reportService.calculateCashFlow(
        mockCashFlowTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31'
      );

      // Transfer should not appear in income or expenses
      expect(result.income.find((i) => i.categoryId === 'cat3')).toBeUndefined();
      expect(result.expenses.find((e) => e.categoryId === 'cat3')).toBeUndefined();
    });

    it('should filter by date range', () => {
      const result = reportService.calculateCashFlow(
        mockCashFlowTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31'
      );

      // Should not include February transaction
      expect(result.totalExpenses).toBe(500);
    });

    it('should group by category', () => {
      const result = reportService.calculateCashFlow(
        mockCashFlowTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31'
      );

      expect(result.income[0].categoryName).toBe('Salary');
      expect(result.income[0].total).toBe(3000);
      expect(result.income[0].transactionCount).toBe(1);
      expect(result.expenses[0].categoryName).toBe('Groceries');
      expect(result.expenses[0].total).toBe(500);
      expect(result.expenses[0].transactionCount).toBe(1);
    });

    it('should handle empty transactions', () => {
      const result = reportService.calculateCashFlow([], mockTypes, mockCategories, '2024-01-01', '2024-01-31');

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.netCashFlow).toBe(0);
      expect(result.income).toHaveLength(0);
      expect(result.expenses).toHaveLength(0);
    });
  });

  describe('calculateCashFlowTrend', () => {
    const mockCategories: Category[] = [
      {
        id: 'cat1',
        name: 'Salary',
        group: Group.INCOME,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cat2',
        name: 'Groceries',
        group: Group.EXPENSE,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockTypes: TransactionType[] = [
      {
        id: 'type1',
        name: 'Salary',
        categoryId: 'cat1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'type2',
        name: 'Groceries',
        categoryId: 'cat2',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockTrendTransactions: Transaction[] = [
      {
        id: 'tx1',
        date: '2024-01-15',
        description: 'Income 1',
        amount: 3000,
        transactionTypeId: 'type1',
        toAccountId: 'acc1',
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      },
      {
        id: 'tx2',
        date: '2024-02-15',
        description: 'Income 2',
        amount: 3500,
        transactionTypeId: 'type1',
        toAccountId: 'acc1',
        createdAt: '2024-02-15T00:00:00.000Z',
        updatedAt: '2024-02-15T00:00:00.000Z',
      },
      {
        id: 'tx3',
        date: '2024-01-20',
        description: 'Expense 1',
        amount: 500,
        transactionTypeId: 'type2',
        fromAccountId: 'acc1',
        createdAt: '2024-01-20T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z',
      },
      {
        id: 'tx4',
        date: '2024-02-20',
        description: 'Expense 2',
        amount: 600,
        transactionTypeId: 'type2',
        fromAccountId: 'acc1',
        createdAt: '2024-02-20T00:00:00.000Z',
        updatedAt: '2024-02-20T00:00:00.000Z',
      },
    ];

    it('should calculate trend points over time', () => {
      const result = reportService.calculateCashFlowTrend(
        mockTrendTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-02-29',
        30
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('income');
      expect(result[0]).toHaveProperty('expenses');
      expect(result[0]).toHaveProperty('netCashFlow');
    });

    it('should respect interval parameter', () => {
      const result = reportService.calculateCashFlowTrend(
        mockTrendTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31',
        15
      );

      // Should have approximately 2 data points for 30-day period with 15-day intervals
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array for invalid date range', () => {
      const result = reportService.calculateCashFlowTrend(
        mockTrendTransactions,
        mockTypes,
        mockCategories,
        '2024-02-01',
        '2024-01-01', // End before start
        30
      );

      expect(result).toHaveLength(0);
    });

    it('should calculate net cash flow correctly in each period', () => {
      const result = reportService.calculateCashFlowTrend(
        mockTrendTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31',
        30
      );

      // First period should have income 3000 and expense 500
      expect(result[0].income).toBe(3000);
      expect(result[0].expenses).toBe(500);
      expect(result[0].netCashFlow).toBe(2500);
    });
  });
});
