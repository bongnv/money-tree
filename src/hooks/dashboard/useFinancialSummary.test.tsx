/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { useFinancialSummary } from './useFinancialSummary';
import { useStore } from '@/contexts/StoreContext';
import { useServiceContext } from '@/contexts/ServiceContext';
import { CurrencyCode } from '@/types/enums';
import type { Account, ManualAsset } from '@/types/models';

jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/ServiceContext');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseServiceContext = useServiceContext as jest.MockedFunction<typeof useServiceContext>;

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

  const period = {
    value: 'current-month',
    label: 'January 2024',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  };

  const mockCalculationService = {
    calculateNetWorth: jest.fn().mockReturnValue(15000),
    calculateSavingsRate: jest.fn().mockReturnValue(40),
  };

  const mockReportService = {
    calculateCashFlow: jest.fn().mockReturnValue({
      totalIncome: 5000,
      totalExpenses: 3000,
      netCashFlow: 2000,
      income: [],
      expenses: [],
    }),
    calculateBudgetPerformance: jest.fn().mockReturnValue({
      overallHealthScore: 85,
      items: [],
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseServiceContext.mockReturnValue({
      calculationService: mockCalculationService,
      reportService: mockReportService,
    } as any);
  });

  it('should calculate financial summary with all data', () => {
    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      transactions: [],
      assets: [mockAsset],
      budgets: [],
      categories: [],
      transactionTypes: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    const { result } = renderHook(() => useFinancialSummary(period));

    expect(result.current.netWorth).toBe(15000);
    expect(result.current.cashFlow).toBe(2000);
    expect(result.current.savingsRate).toBe(40);
    expect(result.current.budgetHealth).toBe(85);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should return isLoading true when store not loaded', () => {
    mockUseStore.mockReturnValue({
      accounts: undefined,
      transactions: undefined,
      assets: undefined,
      budgets: undefined,
      categories: undefined,
      transactionTypes: undefined,
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: undefined,
      isStoreLoaded: false,
    } as any);

    const { result } = renderHook(() => useFinancialSummary(period));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.netWorth).toBe(0);
  });

  it('should return zero values when data is undefined', () => {
    mockUseStore.mockReturnValue({
      accounts: undefined,
      transactions: undefined,
      assets: undefined,
      budgets: undefined,
      categories: undefined,
      transactionTypes: undefined,
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: undefined,
      isStoreLoaded: false,
    } as any);

    const { result } = renderHook(() => useFinancialSummary(period));

    expect(result.current.netWorth).toBe(0);
    expect(result.current.cashFlow).toBe(0);
    expect(result.current.savingsRate).toBe(0);
    expect(result.current.budgetHealth).toBe(0);
  });

  it('should handle net worth calculation error', () => {
    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      transactions: [],
      assets: [mockAsset],
      budgets: [],
      categories: [],
      transactionTypes: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    mockCalculationService.calculateNetWorth.mockImplementation(() => {
      throw new Error('Missing exchange rate');
    });

    const { result } = renderHook(() => useFinancialSummary(period));

    expect(result.current.netWorth).toBe(0);
    expect(result.current.error).toBe('Missing exchange rate');
  });

  it('should handle net worth calculation with non-Error exception', () => {
    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      transactions: [],
      assets: [mockAsset],
      budgets: [],
      categories: [],
      transactionTypes: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    mockCalculationService.calculateNetWorth.mockImplementation(() => {
      throw 'string error';
    });

    const { result } = renderHook(() => useFinancialSummary(period));

    expect(result.current.netWorth).toBe(0);
    expect(result.current.error).toBe('Unknown error');
  });

  it('should handle cash flow / report calculation error gracefully', () => {
    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      transactions: [],
      assets: [mockAsset],
      budgets: [],
      categories: [],
      transactionTypes: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    mockReportService.calculateCashFlow.mockImplementation(() => {
      throw new Error('Report error');
    });

    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useFinancialSummary(period));

    expect(result.current.cashFlow).toBe(0);
    expect(result.current.savingsRate).toBe(0);
    expect(result.current.budgetHealth).toBe(0);

    consoleError.mockRestore();
  });

  it('should filter transactions by period dates', () => {
    const inPeriodTx = {
      id: 'tx-1',
      date: '2024-01-15',
      amount: 100,
      transactionTypeId: 'type-1',
      fromAccountId: 'acc-1',
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    const outOfPeriodTx = {
      id: 'tx-2',
      date: '2024-02-15',
      amount: 200,
      transactionTypeId: 'type-1',
      fromAccountId: 'acc-1',
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      transactions: [inPeriodTx, outOfPeriodTx],
      assets: [],
      budgets: [],
      categories: [],
      transactionTypes: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    renderHook(() => useFinancialSummary(period));

    // The report service should only receive the in-period transaction
    expect(mockReportService.calculateCashFlow).toHaveBeenCalledWith(
      [inPeriodTx],
      expect.anything(),
      expect.anything(),
      '2024-01-01',
      '2024-01-31',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });
});
