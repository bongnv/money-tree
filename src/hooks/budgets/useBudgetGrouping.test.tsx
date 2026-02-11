import { renderHook } from '@testing-library/react';
import { useBudgetGrouping } from './useBudgetGrouping';
import { CurrencyCode } from '@/types/enums';

// Mock the entire store context
jest.mock('@/contexts/StoreContext', () => ({
  useStore: jest.fn(() => ({
    budgets: [],
    transactions: [],
    transactionTypes: [],
    categories: [],
    accounts: [],
    manualAssets: [],
    exchangeRates: [],
    exchangeRatesMap: new Map(),
    baseCurrency: CurrencyCode.USD,
  })),
}));

// Mock the hooks
jest.mock('@/contexts/ServiceContext', () => ({
  useCalculationService: () => ({
    calculateBudgetGrouping: jest.fn(() => ({})),
  }),
}));

describe('useBudgetGrouping', () => {
  it('should return grouped budgets', () => {
    const { result } = renderHook(() =>
      useBudgetGrouping({ startDate: '2024-01-01', endDate: '2024-01-31' }, [], CurrencyCode.USD)
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.groupedBudgets).toEqual({});
  });

  it('should handle period filtering', () => {
    const { result } = renderHook(() =>
      useBudgetGrouping({ startDate: '2024-01-01', endDate: '2024-01-31' }, [], CurrencyCode.USD)
    );

    expect(result.current.groupedBudgets).toBeDefined();
  });

  it('should handle category filtering', () => {
    const { result } = renderHook(() =>
      useBudgetGrouping(
        { startDate: '2024-01-01', endDate: '2024-01-31' },
        ['category-1'],
        CurrencyCode.USD
      )
    );

    expect(result.current.groupedBudgets).toBeDefined();
  });

  it('should handle different base currencies', () => {
    const { result } = renderHook(() =>
      useBudgetGrouping({ startDate: '2024-01-01', endDate: '2024-01-31' }, [], CurrencyCode.VND)
    );

    expect(result.current.groupedBudgets).toBeDefined();
  });
});
