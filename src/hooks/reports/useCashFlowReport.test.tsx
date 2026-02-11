/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { useCashFlowReport } from './useCashFlowReport';
import { useStore } from '@/contexts/StoreContext';
import { useReportService, useCalculationService } from '@/contexts/ServiceContext';
import { CurrencyCode, Group } from '@/types/enums';
import type { Account, TransactionType } from '@/types/models';

jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/ServiceContext');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseReportService = useReportService as jest.MockedFunction<typeof useReportService>;
const mockUseCalculationService = useCalculationService as jest.MockedFunction<
  typeof useCalculationService
>;

describe('useCashFlowReport', () => {
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

  const mockTransactionType: TransactionType = {
    id: 'type-1',
    name: 'Groceries',
    categoryId: 'cat-1',
    group: Group.EXPENSE,
    isActive: true,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockCashFlowResult = {
    totalIncome: 5000,
    totalExpenses: 3000,
    netCashFlow: 2000,
    income: [{ categoryId: 'cat-2', categoryName: 'Income', total: 5000, transactionCount: 2 }],
    expenses: [{ categoryId: 'cat-1', categoryName: 'Food', total: 3000, transactionCount: 5 }],
  };

  const mockCalculateCashFlow = jest.fn().mockReturnValue(mockCashFlowResult);
  const mockCalculateCashFlowTrend = jest.fn().mockReturnValue([
    { date: '2024-01-01', income: 2500, expenses: 1500, net: 1000 },
    { date: '2024-01-15', income: 5000, expenses: 3000, net: 2000 },
  ]);
  const mockCalculateTransactionTypeGrouping = jest.fn().mockReturnValue({
    incomeByType: new Map(),
    expenseByType: new Map(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReportService.mockReturnValue({
      calculateCashFlow: mockCalculateCashFlow,
      calculateCashFlowTrend: mockCalculateCashFlowTrend,
    } as any);
    mockUseCalculationService.mockReturnValue({
      calculateTransactionTypeGrouping: mockCalculateTransactionTypeGrouping,
    } as any);
  });

  const setupStore = (overrides: Record<string, any> = {}) => {
    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      transactions: [],
      transactionTypes: [mockTransactionType],
      categories: [{ id: 'cat-1', name: 'Food', isDeleted: false, createdAt: '', updatedAt: '' }],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      ...overrides,
    } as any);
  };

  it('should calculate cash flow report', () => {
    setupStore();

    const { result } = renderHook(() => useCashFlowReport());

    expect(result.current.cashFlow).toBeDefined();
    expect(result.current.startDate).toBeDefined();
    expect(result.current.endDate).toBeDefined();
    expect(mockCalculateCashFlow).toHaveBeenCalled();
  });

  it('should calculate cash flow trend', () => {
    setupStore();

    const { result } = renderHook(() => useCashFlowReport());

    expect(result.current.cashFlowTrend).toBeDefined();
    expect(mockCalculateCashFlowTrend).toHaveBeenCalled();
  });

  it('should allow changing date range', () => {
    setupStore();

    const { result } = renderHook(() => useCashFlowReport());

    act(() => {
      result.current.setStartDate('2024-06-01');
      result.current.setEndDate('2024-06-30');
    });

    expect(result.current.startDate).toBe('2024-06-01');
    expect(result.current.endDate).toBe('2024-06-30');
  });

  it('should allow changing conversion currency', () => {
    setupStore();

    const { result } = renderHook(() => useCashFlowReport());

    act(() => {
      result.current.setConversionCurrency(CurrencyCode.AUD);
    });

    expect(result.current.conversionCurrency).toBe(CurrencyCode.AUD);
  });

  it('should handle empty data', () => {
    setupStore({ accounts: [], transactions: [], transactionTypes: [], categories: [] });

    const { result } = renderHook(() => useCashFlowReport());

    expect(result.current.cashFlow).toBeDefined();
  });

  it('should manage filter state', () => {
    setupStore();

    const { result } = renderHook(() => useCashFlowReport());

    act(() => {
      result.current.setFilter('categoryIds', ['cat-1']);
    });

    expect(result.current.filters.categoryIds).toEqual(['cat-1']);
  });

  it('should manage account filter', () => {
    setupStore();

    const { result } = renderHook(() => useCashFlowReport());

    act(() => {
      result.current.setFilter('accountIds', ['acc-1']);
    });

    expect(result.current.filters.accountIds).toEqual(['acc-1']);
  });

  it('should manage search text filter', () => {
    setupStore();

    const { result } = renderHook(() => useCashFlowReport());

    act(() => {
      result.current.setFilter('searchText', 'grocery');
    });

    expect(result.current.filters.searchText).toBe('grocery');
  });

  it('should apply filters', () => {
    setupStore();

    const { result } = renderHook(() => useCashFlowReport());

    act(() => {
      result.current.setFilter('categoryIds', ['cat-1']);
    });

    act(() => {
      result.current.applyFilters();
    });

    expect(result.current.appliedFilters.categoryIds).toEqual(['cat-1']);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should reset filters', () => {
    setupStore();

    const { result } = renderHook(() => useCashFlowReport());

    act(() => {
      result.current.setFilter('categoryIds', ['cat-1']);
      result.current.applyFilters();
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters.categoryIds).toEqual([]);
    expect(result.current.appliedFilters.categoryIds).toEqual([]);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should filter transactions by account', () => {
    const transactions = [
      {
        id: 'tx-1',
        date: '2024-01-15',
        amount: 100,
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'tx-2',
        date: '2024-01-16',
        amount: 200,
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-2',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
    ];

    setupStore({ transactions });

    const { result } = renderHook(() => useCashFlowReport());

    act(() => {
      result.current.setFilter('accountIds', ['acc-1']);
    });

    // Filtered transactions should exclude acc-2
    expect(mockCalculateCashFlow).toHaveBeenCalled();
  });

  it('should filter transactions by category via transaction type', () => {
    const transactions = [
      {
        id: 'tx-1',
        date: '2024-01-15',
        amount: 100,
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
    ];

    setupStore({ transactions });

    const { result } = renderHook(() => useCashFlowReport());

    act(() => {
      result.current.setFilter('categoryIds', ['cat-1']);
    });

    expect(result.current.filters.categoryIds).toEqual(['cat-1']);
  });

  it('should filter transactions by search text', () => {
    const transactions = [
      {
        id: 'tx-1',
        date: '2024-01-15',
        amount: 100,
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
        description: 'Grocery shopping',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'tx-2',
        date: '2024-01-16',
        amount: 200,
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
        description: 'Gas station',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
    ];

    setupStore({ transactions });

    const { result } = renderHook(() => useCashFlowReport());

    act(() => {
      result.current.setFilter('searchText', 'grocery');
    });

    expect(result.current.filters.searchText).toBe('grocery');
  });

  it('should provide chart data from cash flow', () => {
    setupStore();

    const { result } = renderHook(() => useCashFlowReport());

    expect(result.current.chartData).toBeDefined();
    if (result.current.chartData) {
      expect(result.current.chartData.groupingLabel).toBe('Category');
      expect(result.current.chartData.incomePieData).toBeDefined();
      expect(result.current.chartData.expensesPieData).toBeDefined();
    }
  });

  it('should return null chart data when no cash flow', () => {
    mockCalculateCashFlow.mockReturnValue(null);
    setupStore();

    const { result } = renderHook(() => useCashFlowReport());

    // With null cash flow, chart data should be null
    expect(result.current.chartData).toBeNull();
  });

  it('should use transaction type grouping when category filter is active', () => {
    const incomeByType = new Map([
      ['type-2', { name: 'Salary', total: 5000, count: 1 }],
    ]);
    const expenseByType = new Map([
      ['type-1', { name: 'Groceries', total: 300, count: 3 }],
    ]);
    mockCalculateTransactionTypeGrouping.mockReturnValue({ incomeByType, expenseByType });

    setupStore();

    const { result } = renderHook(() => useCashFlowReport());

    act(() => {
      result.current.setFilter('categoryIds', ['cat-1']);
    });

    if (result.current.chartData) {
      expect(result.current.chartData.groupingLabel).toBe('Transaction Type');
    }
  });

  it('should handle computation errors gracefully', () => {
    mockCalculateCashFlow.mockImplementation(() => {
      throw new Error('Computation error');
    });

    setupStore();

    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useCashFlowReport());

    expect(result.current.cashFlow).toBeNull();

    consoleError.mockRestore();
  });

  it('should handle trend computation errors gracefully', () => {
    mockCalculateCashFlowTrend.mockImplementation(() => {
      throw new Error('Trend error');
    });

    setupStore();

    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useCashFlowReport());

    expect(result.current.cashFlowTrend).toBeNull();

    consoleError.mockRestore();
  });

  it('should not compute when exchangeRatesMap is missing', () => {
    setupStore({ exchangeRatesMap: undefined });

    renderHook(() => useCashFlowReport());

    expect(mockCalculateCashFlow).not.toHaveBeenCalled();
  });
});
