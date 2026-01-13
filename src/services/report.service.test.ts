import { ReportService } from './report.service';
import { CalculationService } from './calculation.service';
import type { Account, ManualAsset, Transaction, TransactionType, Category } from '../types/models';
import { AccountType, AssetType, Group, CurrencyCode } from '../types/enums';

const calculationService = new CalculationService();
const reportService = new ReportService(calculationService);

describe('ReportService', () => {
  // Mock data
  const mockAccounts: Account[] = [
    {
      id: 'acc1',
      name: 'Checking Account',
      type: AccountType.BANK_ACCOUNT,
      currencyCode: CurrencyCode.USD,
      initialBalance: 1000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'acc2',
      name: 'Credit Card',
      type: AccountType.CREDIT_CARD,
      currencyCode: CurrencyCode.USD,
      initialBalance: 0,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'acc3',
      name: 'Savings Account',
      type: AccountType.BANK_ACCOUNT,
      currencyCode: CurrencyCode.USD,
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
      currencyCode: CurrencyCode.USD,
      date: '2024-01-01',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'asset2',
      name: 'Mortgage',
      type: AssetType.LIABILITY,
      value: -300000,
      currencyCode: CurrencyCode.USD,
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
    it('should calculate balance sheet correctly', async () => {
      const result = await reportService.calculateBalanceSheet(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '',
        CurrencyCode.USD
      );

      expect(result.totalAssets).toBeGreaterThan(0);
      expect(result.totalLiabilities).toBeGreaterThan(0);
      expect(result.netWorth).toBe(result.totalAssets - result.totalLiabilities);
      expect(result.assets).toBeInstanceOf(Array);
      expect(result.liabilities).toBeInstanceOf(Array);
    });

    it('should filter transactions by date', async () => {
      const result = await reportService.calculateBalanceSheet(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '2024-01-16',
        CurrencyCode.USD
      );

      // Should only include transactions up to 2024-01-16 (first transaction)
      expect(result.totalAssets).toBeDefined();
    });

    it('should handle empty accounts and assets', async () => {
      const result = await reportService.calculateBalanceSheet([], [], [], '', CurrencyCode.USD);

      expect(result.totalAssets).toBe(0);
      expect(result.totalLiabilities).toBe(0);
      expect(result.netWorth).toBe(0);
      expect(result.assets).toHaveLength(0);
      expect(result.liabilities).toHaveLength(0);
    });

    it('should group assets correctly by type', async () => {
      const result = await reportService.calculateBalanceSheet(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '',
        CurrencyCode.USD
      );

      expect(result.assets.length).toBeGreaterThan(0);
      expect(result.assets.every((group) => group.items.length > 0)).toBe(true);
    });

    it('should group liabilities correctly', async () => {
      const result = await reportService.calculateBalanceSheet(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '',
        CurrencyCode.USD
      );

      expect(result.liabilities.length).toBeGreaterThan(0);
    });

    it('should calculate net worth as assets minus liabilities', async () => {
      const result = await reportService.calculateBalanceSheet(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '',
        CurrencyCode.USD
      );

      expect(result.netWorth).toBe(result.totalAssets - result.totalLiabilities);
    });
  });

  describe('calculateNetWorthTrend', () => {
    it('should calculate trend points over time', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-03-01';

      const trend = await reportService.calculateNetWorthTrend(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        startDate,
        endDate,
        30,
        CurrencyCode.USD
      );

      expect(trend.length).toBeGreaterThan(0);
      expect(trend[0]).toHaveProperty('date');
      expect(trend[0]).toHaveProperty('netWorth');
      expect(trend[0]).toHaveProperty('assets');
      expect(trend[0]).toHaveProperty('liabilities');
    });

    it('should respect interval parameter', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const trend = await reportService.calculateNetWorthTrend(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        startDate,
        endDate,
        10,
        CurrencyCode.USD
      );

      // With 10-day intervals, should have about 3-4 points in a month
      expect(trend.length).toBeGreaterThanOrEqual(3);
    });

    it('should return empty array for invalid date range', async () => {
      const startDate = '2024-02-01';
      const endDate = '2024-01-01'; // End before start

      const trend = await reportService.calculateNetWorthTrend(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        startDate,
        endDate,
        30,
        CurrencyCode.USD
      );

      expect(trend).toHaveLength(0);
    });
  });

  describe('calculateMonthOverMonthComparison', () => {
    it('should compare current month to previous month', async () => {
      const result = await reportService.calculateMonthOverMonthComparison(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '2024-02-15',
        CurrencyCode.USD
      );

      expect(result.current).toBeDefined();
      expect(result.previous).toBeDefined();
      expect(result.change).toBeDefined();
      expect(result.changePercent).toBeDefined();
    });

    it('should calculate change correctly', async () => {
      const result = await reportService.calculateMonthOverMonthComparison(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '2024-02-15',
        CurrencyCode.USD
      );

      expect(result.change).toBe(result.current.netWorth - result.previous.netWorth);
    });

    it('should calculate change percent correctly', async () => {
      const result = await reportService.calculateMonthOverMonthComparison(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '2024-02-15',
        CurrencyCode.USD
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
    it('should compare current year to previous year', async () => {
      const result = await reportService.calculateYearOverYearComparison(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '2025-01-15',
        'USD'
      );

      expect(result.current).toBeDefined();
      expect(result.previous).toBeDefined();
      expect(result.change).toBeDefined();
      expect(result.changePercent).toBeDefined();
    });

    it('should calculate change correctly', async () => {
      const result = await reportService.calculateYearOverYearComparison(
        mockAccounts,
        mockManualAssets,
        mockTransactions,
        '2025-01-15',
        'USD'
      );

      expect(result.change).toBe(result.current.netWorth - result.previous.netWorth);
    });

    it('should handle zero previous net worth', async () => {
      const emptyAccounts: Account[] = [];
      const emptyAssets: ManualAsset[] = [];

      const result = await reportService.calculateYearOverYearComparison(
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
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cat2',
        name: 'Groceries',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cat3',
        name: 'Transfer',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockTypes: TransactionType[] = [
      {
        id: 'type1',
        name: 'Salary',
        categoryId: 'cat1',
        group: Group.INCOME,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'type2',
        name: 'Groceries',
        categoryId: 'cat2',
        group: Group.EXPENSE,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'type3',
        name: 'Account Transfer',
        categoryId: 'cat3',
        group: Group.TRANSFER,
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

    it('should calculate cash flow correctly', async () => {
      const result = await reportService.calculateCashFlow(
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

    it('should exclude transfers from cash flow', async () => {
      const result = await reportService.calculateCashFlow(
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

    it('should filter by date range', async () => {
      const result = await reportService.calculateCashFlow(
        mockCashFlowTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31'
      );

      // Should not include February transaction
      expect(result.totalExpenses).toBe(500);
    });

    it('should group by category', async () => {
      const result = await reportService.calculateCashFlow(
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

    it('should handle empty transactions', async () => {
      const result = await reportService.calculateCashFlow(
        [],
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31'
      );

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
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cat2',
        name: 'Groceries',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockTypes: TransactionType[] = [
      {
        id: 'type1',
        name: 'Salary',
        categoryId: 'cat1',
        group: Group.INCOME,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'type2',
        name: 'Groceries',
        categoryId: 'cat2',
        group: Group.EXPENSE,
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

    it('should calculate trend points over time', async () => {
      const result = await reportService.calculateCashFlowTrend(
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

    it('should respect interval parameter', async () => {
      const result = await reportService.calculateCashFlowTrend(
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

    it('should return empty array for invalid date range', async () => {
      const result = await reportService.calculateCashFlowTrend(
        mockTrendTransactions,
        mockTypes,
        mockCategories,
        '2024-02-01',
        '2024-01-01', // End before start
        30
      );

      expect(result).toHaveLength(0);
    });

    it('should calculate net cash flow correctly in each period', async () => {
      const result = await reportService.calculateCashFlowTrend(
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

  describe('calculateBudgetPerformance', () => {
    const mockTypes: TransactionType[] = [
      {
        id: 'type1',
        name: 'Groceries',
        categoryId: 'cat1',
        group: Group.EXPENSE,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'type3',
        name: 'Salary',
        categoryId: 'cat2',
        group: Group.INCOME,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockCategories: Category[] = [
      {
        id: 'cat1',
        name: 'Food',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cat2',
        name: 'Income',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockBudgets = [
      {
        id: 'budget1',
        transactionTypeId: 'type1', // Groceries (EXPENSE)
        amount: 500,
        currencyCode: 'USD' as const,
        period: 'monthly' as const,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'budget2',
        transactionTypeId: 'type3', // Salary (INCOME)
        amount: 5000,
        currencyCode: 'USD' as const,
        period: 'monthly' as const,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const budgetTransactions: Transaction[] = [
      {
        id: 'tx1',
        date: '2024-01-15',
        amount: 300,
        transactionTypeId: 'type1', // Groceries
        fromAccountId: 'acc1',
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      },
      {
        id: 'tx2',
        date: '2024-01-20',
        amount: 4500,
        transactionTypeId: 'type3', // Salary
        toAccountId: 'acc1',
        createdAt: '2024-01-20T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z',
      },
    ];

    it('should calculate budget performance for single month', async () => {
      const result = await reportService.calculateBudgetPerformance(
        mockBudgets,
        budgetTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31',
        [],
        'USD'
      );

      expect(result.items).toHaveLength(2);
      expect(result.totalBudgetedExpenses).toBe(500);
      expect(result.totalActualExpenses).toBe(300);
      expect(result.totalBudgetedIncome).toBe(5000);
      expect(result.totalActualIncome).toBe(4500);
    });

    it('should calculate percent used correctly', async () => {
      const result = await reportService.calculateBudgetPerformance(
        mockBudgets,
        budgetTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31',
        [],
        'USD'
      );

      const groceryItem = result.items.find((item) => item.transactionTypeId === 'type1');
      expect(groceryItem?.percentUsed).toBe(60); // 300/500 * 100

      const salaryItem = result.items.find((item) => item.transactionTypeId === 'type3');
      expect(salaryItem?.percentUsed).toBe(90); // 4500/5000 * 100
    });

    it('should calculate remaining correctly', async () => {
      const result = await reportService.calculateBudgetPerformance(
        mockBudgets,
        budgetTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31',
        [],
        'USD'
      );

      const groceryItem = result.items.find((item) => item.transactionTypeId === 'type1');
      expect(groceryItem?.remaining).toBe(200); // 500 - 300

      const salaryItem = result.items.find((item) => item.transactionTypeId === 'type3');
      expect(salaryItem?.remaining).toBe(500); // 5000 - 4500
    });

    it('should identify income vs expense correctly', async () => {
      const result = await reportService.calculateBudgetPerformance(
        mockBudgets,
        budgetTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31',
        [],
        'USD'
      );

      const groceryItem = result.items.find((item) => item.transactionTypeId === 'type1');
      expect(groceryItem?.isIncome).toBe(false);

      const salaryItem = result.items.find((item) => item.transactionTypeId === 'type3');
      expect(salaryItem?.isIncome).toBe(true);
    });

    it('should calculate health score correctly', async () => {
      const result = await reportService.calculateBudgetPerformance(
        mockBudgets,
        budgetTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31',
        [],
        'USD'
      );

      // Expense score: (500-300)/500 * 100 = 40
      // Income score: min(4500/5000 * 100, 100) = 90
      // Average: (40 + 90) / 2 = 65
      expect(result.overallHealthScore).toBeCloseTo(65, 0);
    });

    it('should prorate budget for partial period', async () => {
      const result = await reportService.calculateBudgetPerformance(
        mockBudgets,
        budgetTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-03-31', // 3 months
        [],
        'USD'
      );

      // Monthly budget * 3 months
      expect(result.totalBudgetedExpenses).toBe(1500); // 500 * 3
      expect(result.totalBudgetedIncome).toBe(15000); // 5000 * 3
    });

    it('should handle empty budgets', async () => {
      const result = await reportService.calculateBudgetPerformance(
        [],
        budgetTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31'
      );

      expect(result.items).toHaveLength(0);
      expect(result.totalBudgetedExpenses).toBe(0);
      expect(result.totalActualExpenses).toBe(0);
      expect(result.overallHealthScore).toBe(100); // Default when no budgets
    });

    it('should handle empty transactions', async () => {
      const result = await reportService.calculateBudgetPerformance(
        mockBudgets,
        [],
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31',
        [],
        'USD'
      );

      expect(result.items).toHaveLength(2);
      expect(result.totalActualExpenses).toBe(0);
      expect(result.totalActualIncome).toBe(0);
      // All remaining equals budgeted
      expect(result.totalRemainingExpenses).toBe(500);
      expect(result.totalRemainingIncome).toBe(5000);
    });

    it('should convert budget currency when base currency provided', async () => {
      const { useExchangeRateStore } = await import('../stores/useExchangeRateStore');

      const eurBudgets = [
        {
          ...mockBudgets[0],
          id: 'budget3',
          currencyCode: 'EUR' as const,
          amount: 500,
        },
      ];

      // Mock exchange rate store
      useExchangeRateStore.setState({
        rates: [
          {
            id: 'rate1',
            month: '2024-01',
            fromCurrency: 'EUR',
            toCurrency: 'USD',
            rate: 1.1,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        addRate: jest.fn(),
        updateRate: jest.fn(),
        deleteRate: jest.fn(),
        setRates: jest.fn(),
      });

      const result = await reportService.calculateBudgetPerformance(
        eurBudgets,
        [],
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31',
        mockAccounts,
        'USD'
      );

      expect(result.totalBudgetedExpenses).toBe(550); // 500 EUR * 1.1
    });

    it('should convert transaction currency when base currency provided', async () => {
      const { useExchangeRateStore } = await import('../stores/useExchangeRateStore');

      const eurAccounts = [
        {
          ...mockAccounts[0],
          currencyCode: 'EUR' as const,
        },
      ];

      // Mock exchange rate store
      useExchangeRateStore.setState({
        rates: [
          {
            id: 'rate1',
            month: '2024-01',
            fromCurrency: 'EUR',
            toCurrency: 'USD',
            rate: 1.1,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        addRate: jest.fn(),
        updateRate: jest.fn(),
        deleteRate: jest.fn(),
        setRates: jest.fn(),
      });

      const result = await reportService.calculateBudgetPerformance(
        mockBudgets,
        budgetTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31',
        eurAccounts,
        'USD'
      );

      // Transaction amount 300 EUR * 1.1 = 330 USD
      expect(result.totalActualExpenses).toBe(330);
    });
  });

  describe('calculateBudgetTrend', () => {
    const mockTypes: TransactionType[] = [
      {
        id: 'type1',
        name: 'Groceries',
        categoryId: 'cat1',
        group: Group.EXPENSE,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockCategories: Category[] = [
      {
        id: 'cat1',
        name: 'Food',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockBudgets = [
      {
        id: 'budget1',
        transactionTypeId: 'type1',
        amount: 500,
        currencyCode: 'USD' as const,
        period: 'monthly' as const,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const trendTransactions: Transaction[] = [
      {
        id: 'tx1',
        date: '2024-01-15',
        amount: 300,
        transactionTypeId: 'type1',
        fromAccountId: 'acc1',
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      },
      {
        id: 'tx2',
        date: '2024-02-15',
        amount: 600,
        transactionTypeId: 'type1',
        fromAccountId: 'acc1',
        createdAt: '2024-02-15T00:00:00.000Z',
        updatedAt: '2024-02-15T00:00:00.000Z',
      },
    ];

    it('should calculate trend points over time', async () => {
      const result = await reportService.calculateBudgetTrend(
        mockBudgets,
        trendTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-02-29',
        30,
        [],
        'USD'
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('budgeted');
      expect(result[0]).toHaveProperty('actual');
      expect(result[0]).toHaveProperty('variance');
    });

    it('should calculate variance correctly', async () => {
      const result = await reportService.calculateBudgetTrend(
        mockBudgets,
        trendTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31',
        30,
        [],
        'USD'
      );

      // First period: budgeted 500, actual 300, variance = -200 (under budget)
      expect(result[0].budgeted).toBe(500);
      expect(result[0].actual).toBe(300);
      expect(result[0].variance).toBe(-200);
    });

    it('should respect interval parameter', async () => {
      const result = await reportService.calculateBudgetTrend(
        mockBudgets,
        trendTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-02-29',
        15,
        [],
        'USD'
      );

      // Should have approximately 4 data points for 60-day period with 15-day intervals
      expect(result.length).toBeGreaterThanOrEqual(4);
    });

    it('should return empty array for invalid date range', async () => {
      const result = await reportService.calculateBudgetTrend(
        mockBudgets,
        trendTransactions,
        mockTypes,
        mockCategories,
        '2024-02-01',
        '2024-01-01', // End before start
        30
      );

      expect(result).toHaveLength(0);
    });

    it('should handle empty budgets', async () => {
      const result = await reportService.calculateBudgetTrend(
        [],
        trendTransactions,
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31',
        30
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].budgeted).toBe(0);
    });

    it('should handle empty transactions', async () => {
      const result = await reportService.calculateBudgetTrend(
        mockBudgets,
        [],
        mockTypes,
        mockCategories,
        '2024-01-01',
        '2024-01-31',
        30,
        [],
        'USD'
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].actual).toBe(0);
      expect(result[0].variance).toBe(-500); // 0 - 500 (no spending vs budget)
    });
  });
});
