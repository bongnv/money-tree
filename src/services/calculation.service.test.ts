import { calculationService } from './calculation.service';
import type { Transaction, Account, ManualAsset } from '../types/models';
import { AccountType, AssetType, CurrencyCode } from '../types/enums';

const mockAccount1: Account = {
  id: 'acc-1',
  name: 'Checking',
  type: AccountType.BANK_ACCOUNT,
  currencyCode: CurrencyCode.USD,
  initialBalance: 1000,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockAccount2: Account = {
  id: 'acc-2',
  name: 'Savings',
  type: AccountType.BANK_ACCOUNT,
  currencyCode: CurrencyCode.USD,
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
      const balance = calculationService.calculateAccountBalance(mockAccount1, [incomeTransaction]);
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

  describe('prorateBudget', () => {
    it('should return same amount when periods are equal', () => {
      expect(calculationService.prorateBudget(100, 'monthly', 'monthly')).toBe(100);
      expect(calculationService.prorateBudget(300, 'quarterly', 'quarterly')).toBe(300);
      expect(calculationService.prorateBudget(1200, 'yearly', 'yearly')).toBe(1200);
    });

    it('should convert monthly to quarterly', () => {
      expect(calculationService.prorateBudget(100, 'monthly', 'quarterly')).toBe(300);
      expect(calculationService.prorateBudget(400, 'monthly', 'quarterly')).toBe(1200);
    });

    it('should convert monthly to yearly', () => {
      expect(calculationService.prorateBudget(100, 'monthly', 'yearly')).toBe(1200);
      expect(calculationService.prorateBudget(500, 'monthly', 'yearly')).toBe(6000);
    });

    it('should convert quarterly to monthly', () => {
      expect(calculationService.prorateBudget(300, 'quarterly', 'monthly')).toBe(100);
      expect(calculationService.prorateBudget(600, 'quarterly', 'monthly')).toBe(200);
    });

    it('should convert quarterly to yearly', () => {
      expect(calculationService.prorateBudget(300, 'quarterly', 'yearly')).toBe(1200);
      expect(calculationService.prorateBudget(900, 'quarterly', 'yearly')).toBe(3600);
    });

    it('should convert yearly to monthly', () => {
      expect(calculationService.prorateBudget(1200, 'yearly', 'monthly')).toBe(100);
      expect(calculationService.prorateBudget(2400, 'yearly', 'monthly')).toBe(200);
    });

    it('should convert yearly to quarterly', () => {
      expect(calculationService.prorateBudget(1200, 'yearly', 'quarterly')).toBe(300);
      expect(calculationService.prorateBudget(3600, 'yearly', 'quarterly')).toBe(900);
    });

    it('should handle decimal results', () => {
      expect(calculationService.prorateBudget(100, 'monthly', 'yearly')).toBe(1200);
      expect(calculationService.prorateBudget(1000, 'yearly', 'monthly')).toBeCloseTo(83.33, 2);
      expect(calculationService.prorateBudget(500, 'quarterly', 'monthly')).toBeCloseTo(166.67, 2);
    });
  });

  describe('calculateActualAmount', () => {
    const transactions: Transaction[] = [
      {
        id: 'txn-1',
        date: '2026-01-05',
        description: 'Groceries',
        amount: 100,
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
        createdAt: '2026-01-05T00:00:00.000Z',
        updatedAt: '2026-01-05T00:00:00.000Z',
      },
      {
        id: 'txn-2',
        date: '2026-01-15',
        description: 'Groceries',
        amount: 150,
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      },
      {
        id: 'txn-3',
        date: '2026-01-20',
        description: 'Restaurant',
        amount: 50,
        transactionTypeId: 'type-2',
        fromAccountId: 'acc-1',
        createdAt: '2026-01-20T00:00:00.000Z',
        updatedAt: '2026-01-20T00:00:00.000Z',
      },
      {
        id: 'txn-4',
        date: '2026-02-05',
        description: 'Groceries',
        amount: 120,
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
        createdAt: '2026-02-05T00:00:00.000Z',
        updatedAt: '2026-02-05T00:00:00.000Z',
      },
    ];

    it('should calculate total for transaction type in date range', () => {
      const total = calculationService.calculateActualAmount(
        'type-1',
        transactions,
        '2026-01-01',
        '2026-01-31'
      );
      expect(total).toBe(250); // 100 + 150
    });

    it('should exclude transactions outside date range', () => {
      const total = calculationService.calculateActualAmount(
        'type-1',
        transactions,
        '2026-01-01',
        '2026-01-10'
      );
      expect(total).toBe(100); // Only first transaction
    });

    it('should return 0 for transaction type with no transactions in range', () => {
      const total = calculationService.calculateActualAmount(
        'type-3',
        transactions,
        '2026-01-01',
        '2026-01-31'
      );
      expect(total).toBe(0);
    });

    it('should include transactions on boundary dates', () => {
      const total = calculationService.calculateActualAmount(
        'type-1',
        transactions,
        '2026-01-05',
        '2026-01-15'
      );
      expect(total).toBe(250); // Both boundary transactions included
    });

    it('should work across multiple months', () => {
      const total = calculationService.calculateActualAmount(
        'type-1',
        transactions,
        '2026-01-01',
        '2026-02-28'
      );
      expect(total).toBe(370); // 100 + 150 + 120
    });

    it('should filter by transaction type', () => {
      const total = calculationService.calculateActualAmount(
        'type-2',
        transactions,
        '2026-01-01',
        '2026-01-31'
      );
      expect(total).toBe(50); // Only type-2 transaction
    });
  });

  describe('getActiveBudgetForPeriod', () => {
    const budgets = [
      {
        id: '1',
        transactionTypeId: 'type-1',
        currencyCode: CurrencyCode.USD,
        amount: 500,
        period: 'monthly' as const,
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        transactionTypeId: 'type-1',
        currencyCode: CurrencyCode.USD,
        amount: 600,
        period: 'monthly' as const,
        startDate: '2026-07-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: '3',
        transactionTypeId: 'type-2',
        currencyCode: CurrencyCode.USD,
        amount: 300,
        period: 'monthly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    it('should return budget active on given date', () => {
      const budget = calculationService.getActiveBudgetForPeriod(budgets, 'type-1', '2026-03-15');
      expect(budget?.id).toBe('1');
      expect(budget?.amount).toBe(500);
    });

    it('should return second budget when date is in second range', () => {
      const budget = calculationService.getActiveBudgetForPeriod(budgets, 'type-1', '2026-09-15');
      expect(budget?.id).toBe('2');
      expect(budget?.amount).toBe(600);
    });

    it('should return year-round budget for any date', () => {
      const budget = calculationService.getActiveBudgetForPeriod(budgets, 'type-2', '2026-03-15');
      expect(budget?.id).toBe('3');
      expect(budget?.amount).toBe(300);
    });

    it('should return undefined when date is before start date', () => {
      const budget = calculationService.getActiveBudgetForPeriod(budgets, 'type-1', '2025-12-15');
      expect(budget).toBeUndefined();
    });

    it('should return undefined when date is after end date', () => {
      const budget = calculationService.getActiveBudgetForPeriod(budgets, 'type-1', '2027-01-15');
      expect(budget).toBeUndefined();
    });

    it('should return undefined for non-existent transaction type', () => {
      const budget = calculationService.getActiveBudgetForPeriod(budgets, 'type-3', '2026-03-15');
      expect(budget).toBeUndefined();
    });

    it('should handle date on start boundary', () => {
      const budget = calculationService.getActiveBudgetForPeriod(budgets, 'type-1', '2026-01-01');
      expect(budget?.id).toBe('1');
    });

    it('should handle date on end boundary', () => {
      const budget = calculationService.getActiveBudgetForPeriod(budgets, 'type-1', '2026-06-30');
      expect(budget?.id).toBe('1');
    });

    it('should return budget when date is within range', () => {
      const yearRoundBudget = [
        {
          id: '1',
          transactionTypeId: 'type-1',
          currencyCode: CurrencyCode.USD,
          amount: 500,
          period: 'monthly' as const,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      const budget = calculationService.getActiveBudgetForPeriod(
        yearRoundBudget,
        'type-1',
        '2026-12-31'
      );
      expect(budget?.id).toBe('1');
    });

    it('should return budget when date is in middle of range', () => {
      const midYearBudget = [
        {
          id: '1',
          transactionTypeId: 'type-1',
          currencyCode: CurrencyCode.USD,
          amount: 500,
          period: 'monthly' as const,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      const budget = calculationService.getActiveBudgetForPeriod(
        midYearBudget,
        'type-1',
        '2026-06-15'
      );
      expect(budget?.id).toBe('1');
    });
  });

  describe('getDaysInPeriod', () => {
    it('should count days correctly for same day', () => {
      const days = calculationService.getDaysInPeriod('2026-01-01', '2026-01-01');
      expect(days).toBe(1);
    });

    it('should count days correctly for a month', () => {
      const days = calculationService.getDaysInPeriod('2026-01-01', '2026-01-31');
      expect(days).toBe(31);
    });

    it('should count days correctly for February (non-leap year)', () => {
      const days = calculationService.getDaysInPeriod('2026-02-01', '2026-02-28');
      expect(days).toBe(28);
    });

    it('should count days correctly for February (leap year)', () => {
      const days = calculationService.getDaysInPeriod('2024-02-01', '2024-02-29');
      expect(days).toBe(29);
    });

    it('should count days correctly for a quarter', () => {
      const days = calculationService.getDaysInPeriod('2026-01-01', '2026-03-31');
      expect(days).toBe(90);
    });

    it('should count days correctly for a full year (non-leap)', () => {
      const days = calculationService.getDaysInPeriod('2026-01-01', '2026-12-31');
      expect(days).toBe(365);
    });

    it('should count days correctly for a full year (leap)', () => {
      const days = calculationService.getDaysInPeriod('2024-01-01', '2024-12-31');
      expect(days).toBe(366);
    });

    it('should handle date ranges in reverse order', () => {
      const days = calculationService.getDaysInPeriod('2026-01-31', '2026-01-01');
      expect(days).toBe(31); // Uses absolute difference
    });
  });

  describe('prorateBudgetForPeriod', () => {
    it('should show monthly budget as-is for single month', () => {
      const budget = {
        id: '1',
        transactionTypeId: 'type-1',
        currencyCode: CurrencyCode.USD,
        amount: 1500,
        period: 'monthly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const prorated = calculationService.prorateBudgetForPeriod(
        budget,
        '2026-01-01',
        '2026-01-31'
      );
      expect(prorated).toBe(1500); // 1 month
    });

    it('should convert monthly budget to quarterly (3 months)', () => {
      const budget = {
        id: '1',
        transactionTypeId: 'type-1',
        currencyCode: CurrencyCode.USD,
        amount: 1500,
        period: 'monthly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const prorated = calculationService.prorateBudgetForPeriod(
        budget,
        '2026-01-01',
        '2026-03-31'
      );
      expect(prorated).toBe(4500); // 1500 * 3
    });

    it('should convert monthly budget to yearly (12 months)', () => {
      const budget = {
        id: '1',
        transactionTypeId: 'type-1',
        currencyCode: CurrencyCode.USD,
        amount: 1500,
        period: 'monthly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const prorated = calculationService.prorateBudgetForPeriod(
        budget,
        '2026-01-01',
        '2026-12-31'
      );
      expect(prorated).toBe(18000); // 1500 * 12
    });

    it('should show quarterly budget as-is for single quarter', () => {
      const budget = {
        id: '1',
        transactionTypeId: 'type-1',
        currencyCode: CurrencyCode.USD,
        amount: 4500,
        period: 'quarterly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const prorated = calculationService.prorateBudgetForPeriod(
        budget,
        '2026-01-01',
        '2026-03-31'
      );
      expect(prorated).toBe(4500); // 3 months
    });

    it('should convert quarterly budget to monthly', () => {
      const budget = {
        id: '1',
        transactionTypeId: 'type-1',
        currencyCode: CurrencyCode.USD,
        amount: 4500,
        period: 'quarterly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const prorated = calculationService.prorateBudgetForPeriod(
        budget,
        '2026-01-01',
        '2026-01-31'
      );
      expect(prorated).toBe(1500); // 4500 / 3
    });

    it('should convert quarterly budget to yearly (4 quarters)', () => {
      const budget = {
        id: '1',
        transactionTypeId: 'type-1',
        currencyCode: CurrencyCode.USD,
        amount: 4500,
        period: 'quarterly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const prorated = calculationService.prorateBudgetForPeriod(
        budget,
        '2026-01-01',
        '2026-12-31'
      );
      expect(prorated).toBe(18000); // 4500 * 4
    });

    it('should show yearly budget as-is for full year', () => {
      const budget = {
        id: '1',
        transactionTypeId: 'type-1',
        currencyCode: CurrencyCode.USD,
        amount: 18000,
        period: 'yearly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const prorated = calculationService.prorateBudgetForPeriod(
        budget,
        '2026-01-01',
        '2026-12-31'
      );
      expect(prorated).toBe(18000); // 12 months
    });

    it('should convert yearly budget to monthly', () => {
      const budget = {
        id: '1',
        transactionTypeId: 'type-1',
        currencyCode: CurrencyCode.USD,
        amount: 18000,
        period: 'yearly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const prorated = calculationService.prorateBudgetForPeriod(
        budget,
        '2026-01-01',
        '2026-01-31'
      );
      expect(prorated).toBe(1500); // 18000 / 12
    });

    it('should convert yearly budget to quarterly', () => {
      const budget = {
        id: '1',
        transactionTypeId: 'type-1',
        currencyCode: CurrencyCode.USD,
        amount: 18000,
        period: 'yearly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const prorated = calculationService.prorateBudgetForPeriod(
        budget,
        '2026-01-01',
        '2026-03-31'
      );
      expect(prorated).toBe(4500); // 18000 / 4
    });

    it('should handle partial overlap - budget active for part of viewing period', () => {
      const budget = {
        id: '1',
        transactionTypeId: 'type-1',
        currencyCode: CurrencyCode.USD,
        amount: 1500,
        period: 'monthly' as const,
        startDate: '2026-01-01',
        endDate: '2026-02-28', // Only Jan-Feb (59 days)
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      // Viewing Q1 (90 days), but budget only active Jan-Feb (59 days)
      const prorated = calculationService.prorateBudgetForPeriod(
        budget,
        '2026-01-01',
        '2026-03-31'
      );
      // 1500 * 3 months * (59 days / 90 days) = 4500 * 0.6556 = 2950
      expect(prorated).toBeCloseTo(2950, 0);
    });

    it('should return 0 when budget and viewing period do not overlap', () => {
      const budget = {
        id: '1',
        transactionTypeId: 'type-1',
        currencyCode: CurrencyCode.USD,
        amount: 1500,
        period: 'monthly' as const,
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      // Viewing period is after budget ends
      const prorated = calculationService.prorateBudgetForPeriod(
        budget,
        '2026-07-01',
        '2026-07-31'
      );
      expect(prorated).toBe(0);
    });
  });

  describe('Dashboard Calculations', () => {
    const mockAssets: ManualAsset[] = [
      {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: CurrencyCode.USD,
        valueHistory: [{ date: '2026-01-01', value: 500000 }],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'asset-2',
        name: 'Car',
        type: AssetType.OTHER,
        currencyCode: CurrencyCode.USD,
        valueHistory: [{ date: '2026-01-01', value: 25000 }],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    describe('calculateNetWorth', () => {
      it('should calculate net worth from accounts and assets', async () => {
        const netWorth = await calculationService.calculateNetWorth(
          [mockAccount1, mockAccount2],
          [incomeTransaction, expenseTransaction, transferTransaction],
          mockAssets,
          'USD',
          '2026-01'
        );
        // acc-1: 1000 + 3000 - 200 - 500 = 3300
        // acc-2: 5000 + 500 = 5500
        // assets: 500000 + 25000 = 525000
        // total: 3300 + 5500 + 525000 = 533800
        expect(netWorth).toBe(533800);
      });

      it('should handle empty assets', async () => {
        const netWorth = await calculationService.calculateNetWorth(
          [mockAccount1],
          [incomeTransaction, expenseTransaction],
          [],
          'USD',
          '2026-01'
        );
        // acc-1: 1000 + 3000 - 200 = 3800
        expect(netWorth).toBe(3800);
      });

      it('should handle empty accounts', async () => {
        const netWorth = await calculationService.calculateNetWorth(
          [],
          [],
          mockAssets,
          'USD',
          '2026-01'
        );
        // assets only: 500000 + 25000 = 525000
        expect(netWorth).toBe(525000);
      });
    });

    describe('calculateSavingsRate', () => {
      it('should calculate savings rate', () => {
        const rate = calculationService.calculateSavingsRate(3000, 2000);
        // (3000 - 2000) / 3000 * 100 = 33.33%
        expect(rate).toBeCloseTo(33.33, 2);
      });

      it('should handle zero income', () => {
        const rate = calculationService.calculateSavingsRate(0, 100);
        expect(rate).toBe(0);
      });

      it('should handle negative savings rate', () => {
        const rate = calculationService.calculateSavingsRate(1000, 1500);
        // (1000 - 1500) / 1000 * 100 = -50%
        expect(rate).toBe(-50);
      });

      it('should handle 100% savings rate', () => {
        const rate = calculationService.calculateSavingsRate(1000, 0);
        expect(rate).toBe(100);
      });
    });
  });
});
