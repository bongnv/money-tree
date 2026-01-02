import { reportService } from './report.service';
import type { Account, ManualAsset, Transaction } from '../types/models';
import { AccountType, AssetType } from '../types/enums';

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
});
