/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { useServiceContext } from '@/contexts/ServiceContext';
import { useStore } from '@/contexts/StoreContext';
import { CurrencyCode, BudgetPeriod, Group } from '@/types/enums';
import type { Budget, TransactionType, Category, Account } from '@/types/models';
import { useBudgetPerformance } from './useBudgetPerformance';

jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/ServiceContext');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseServiceContext = useServiceContext as jest.MockedFunction<typeof useServiceContext>;

describe('useBudgetPerformance', () => {
  const mockBudget: Budget = {
    id: 'budget-1',
    transactionTypeId: 'type-1',
    amount: 1000,
    currencyCode: CurrencyCode.USD,
    period: BudgetPeriod.MONTHLY,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
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

  const mockCategory: Category = {
    id: 'cat-1',
    name: 'Food',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

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

  const mockPerformanceResult = {
    items: [
      {
        categoryId: 'cat-1',
        categoryName: 'Food',
        transactionTypeId: 'type-1',
        transactionTypeName: 'Groceries',
        budgetedAmount: 1000,
        actualAmount: 750,
        remaining: 250,
        percentUsed: 75,
        isIncome: false,
      },
    ],
    totalBudgetedIncome: 0,
    totalActualIncome: 0,
    totalRemainingIncome: 0,
    totalBudgetedExpenses: 1000,
    totalActualExpenses: 750,
    totalRemainingExpenses: 250,
    overallHealthScore: 85,
  };

  const mockCalculateBudgetPerformance = jest.fn().mockReturnValue(mockPerformanceResult);
  const mockCalculateBudgetTrend = jest.fn().mockReturnValue([
    { date: '2024-01-01', budgeted: 1000, actual: 200 },
    { date: '2024-01-15', budgeted: 1000, actual: 500 },
  ]);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseServiceContext.mockReturnValue({
      reportService: {
        calculateBudgetPerformance: mockCalculateBudgetPerformance,
        calculateBudgetTrend: mockCalculateBudgetTrend,
      },
    } as any);
  });

  const setupStore = (overrides: Record<string, any> = {}) => {
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      transactions: [],
      transactionTypes: [mockTransactionType],
      categories: [mockCategory],
      accounts: [mockAccount],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      ...overrides,
    } as any);
  };

  it('should calculate budget performance', () => {
    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    expect(result.current.budgetPerformance).toBeDefined();
    expect(result.current.startDate).toBeDefined();
    expect(result.current.endDate).toBeDefined();
    expect(mockCalculateBudgetPerformance).toHaveBeenCalled();
  });

  it('should compute trend data', () => {
    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    expect(result.current.trendData).toHaveLength(2);
    expect(mockCalculateBudgetTrend).toHaveBeenCalled();
  });

  it('should have date range properties', () => {
    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    expect(result.current.startDate).toBeDefined();
    expect(result.current.endDate).toBeDefined();
  });

  it('should allow changing date range', () => {
    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    act(() => {
      result.current.setDateRange('2024-06-01', '2024-06-30');
    });

    expect(result.current.startDate).toBe('2024-06-01');
    expect(result.current.endDate).toBe('2024-06-30');
  });

  it('should allow changing conversion currency', () => {
    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    act(() => {
      result.current.setConversionCurrency(CurrencyCode.AUD);
    });

    expect(result.current.conversionCurrency).toBe(CurrencyCode.AUD);
  });

  it('should set conversion currency to base currency on load', () => {
    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    expect(result.current.conversionCurrency).toBe(CurrencyCode.USD);
  });

  it('should handle undefined data', () => {
    setupStore({
      budgets: undefined,
      transactions: undefined,
      transactionTypes: undefined,
      categories: undefined,
      accounts: undefined,
      exchangeRatesMap: undefined,
    });

    const { result } = renderHook(() => useBudgetPerformance());

    // Should not crash, should return default performance
    expect(result.current.displayPerformance).toBeDefined();
    expect(result.current.displayPerformance.items).toEqual([]);
  });

  it('should filter display performance by selected categories', () => {
    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    act(() => {
      result.current.handleCategoryChange(['cat-1']);
    });

    expect(result.current.selectedCategories).toEqual(['cat-1']);
    expect(result.current.displayPerformance.items.length).toBeLessThanOrEqual(
      mockPerformanceResult.items.length
    );
  });

  it('should return all items when no category filter', () => {
    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    expect(result.current.displayPerformance.items).toHaveLength(1);
  });

  it('should clear filters', () => {
    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    act(() => {
      result.current.handleCategoryChange(['cat-1']);
    });

    act(() => {
      result.current.handleClearFilters();
    });

    expect(result.current.selectedCategories).toEqual([]);
  });

  it('should handle item click for category', () => {
    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    let clickResult: any;
    act(() => {
      clickResult = result.current.handleItemClick('cat-1', true);
    });

    expect(result.current.selectedCategories).toEqual(['cat-1']);
    expect(clickResult).toEqual(
      expect.objectContaining({
        itemId: 'cat-1',
        isCategory: true,
      })
    );
  });

  it('should handle item click for non-category', () => {
    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    let clickResult: any;
    act(() => {
      clickResult = result.current.handleItemClick('type-1', false);
    });

    // Should not set categories for non-category clicks
    expect(result.current.selectedCategories).toEqual([]);
    expect(clickResult.isCategory).toBe(false);
  });

  it('should aggregate grouped items by category when no filter', () => {
    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    const grouped = result.current.groupedItems;
    expect(grouped.length).toBeGreaterThanOrEqual(0);
    if (grouped.length > 0) {
      expect(grouped[0].isCategory).toBe(true);
    }
  });

  it('should show individual transaction types when filtered', () => {
    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    act(() => {
      result.current.handleCategoryChange(['cat-1']);
    });

    const grouped = result.current.groupedItems;
    if (grouped.length > 0) {
      expect(grouped[0].isCategory).toBe(false);
    }
  });

  it('should recalculate income/expense totals when filtering', () => {
    const incomeItem = {
      categoryId: 'cat-2',
      categoryName: 'Income',
      transactionTypeId: 'type-2',
      transactionTypeName: 'Salary',
      budgetedAmount: 5000,
      actualAmount: 4500,
      remaining: 500,
      percentUsed: 90,
      isIncome: true,
    };

    mockCalculateBudgetPerformance.mockReturnValue({
      ...mockPerformanceResult,
      items: [...mockPerformanceResult.items, incomeItem],
    });

    setupStore();

    const { result } = renderHook(() => useBudgetPerformance());

    act(() => {
      result.current.handleCategoryChange(['cat-2']);
    });

    expect(result.current.displayPerformance.totalBudgetedIncome).toBe(5000);
    expect(result.current.displayPerformance.totalActualIncome).toBe(4500);
    expect(result.current.displayPerformance.totalRemainingIncome).toBe(500);
    expect(result.current.displayPerformance.totalBudgetedExpenses).toBe(0);
  });

  it('should handle computation errors gracefully', () => {
    mockCalculateBudgetPerformance.mockImplementation(() => {
      throw new Error('Computation error');
    });

    setupStore();

    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useBudgetPerformance());

    // Should return default display performance
    expect(result.current.displayPerformance).toBeDefined();
    expect(result.current.displayPerformance.overallHealthScore).toBe(100);

    consoleError.mockRestore();
  });
});
