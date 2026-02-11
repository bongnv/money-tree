/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { useFinancialSummary } from './useFinancialSummary';
import { useStore } from '@/contexts/StoreContext';
import { CurrencyCode } from '@/types/enums';
import type { Account, ManualAsset } from '@/types/models';

jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/ServiceContext', () => ({
  useCalculationService: jest.fn(() => ({
    calculateAccountBalance: jest.fn(() => 1000),
  })),
  useReportService: jest.fn(() => ({
    calculateCashFlow: jest.fn(() => ({ income: 5000, expenses: 3000, netCashFlow: 2000 })),
    calculateBudgetPerformance: jest.fn(() => []),
  })),
}));

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

describe('useFinancialSummary', () => {
  const mockAccount: Account = {
    id: 'acc-1',
    name: 'Checking',
    type: 'bank_account' as any,
    currencyCode: CurrencyCode.USD,
    initialBalance: 1000,
    isActive: true,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockAsset: ManualAsset = {
    id: 'asset-1',
    name: 'Investment',
    type: 'stocks_and_shares' as any,
    currencyCode: CurrencyCode.USD,
    valueHistory: [{ date: '2024-01-01', value: 10000 }],
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate financial summary', () => {
    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      transactions: [],
      assets: [mockAsset],
      budgets: [],
      categories: [],
      transactionTypes: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    const period = {
      value: 'current-month',
      label: 'January 2024',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    const { result } = renderHook(() => useFinancialSummary(period));

    expect(result.current.netWorth).toBeDefined();
    expect(result.current.cashFlow).toBeDefined();
    expect(result.current.savingsRate).toBeDefined();
    expect(result.current.budgetHealth).toBeDefined();
  });

  it('should handle undefined data', () => {
    mockUseStore.mockReturnValue({
      accounts: undefined,
      transactions: undefined,
      assets: undefined,
      budgets: undefined,
      categories: undefined,
      transactionTypes: undefined,
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    const period = {
      value: 'current-month',
      label: 'January 2024',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    const { result } = renderHook(() => useFinancialSummary(period));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.netWorth).toBe(0);
  });
});
