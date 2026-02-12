/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { useBudgetGrouping } from './useBudgetGrouping';
import { useStore } from '@/contexts/StoreContext';
import { useServiceContext } from '@/contexts/ServiceContext';
import { CurrencyCode, BudgetPeriod, Group } from '@/types/enums';
import type { Budget, TransactionType, Category } from '@/types/models';

jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/ServiceContext');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseServiceContext = useServiceContext as jest.MockedFunction<typeof useServiceContext>;

describe('useBudgetGrouping', () => {
  const mockCategory: Category = {
    id: 'cat-1',
    name: 'Food',
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

  const mockTransactionType2: TransactionType = {
    id: 'type-2',
    name: 'Dining Out',
    categoryId: 'cat-1',
    group: Group.EXPENSE,
    isActive: true,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockBudget: Budget = {
    id: 'budget-1',
    transactionTypeId: 'type-1',
    amount: 1000,
    currencyCode: CurrencyCode.USD,
    period: BudgetPeriod.MONTHLY,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockBudgetOutOfRange: Budget = {
    id: 'budget-2',
    transactionTypeId: 'type-2',
    amount: 500,
    currencyCode: CurrencyCode.USD,
    period: BudgetPeriod.MONTHLY,
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockCalculateBudgetGrouping = jest.fn().mockReturnValue({});

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseServiceContext.mockReturnValue({
      calculationService: {
        calculateBudgetGrouping: mockCalculateBudgetGrouping,
      },
    } as any);
  });

  const setupStore = (overrides: Record<string, any> = {}) => {
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      transactions: [],
      transactionTypes: [mockTransactionType, mockTransactionType2],
      categories: [mockCategory],
      accounts: [],
      exchangeRatesMap: new Map(),
      ...overrides,
    } as any);
  };

  it('should return grouped budgets', () => {
    setupStore();

    const { result } = renderHook(() =>
      useBudgetGrouping({ startDate: '2024-01-01', endDate: '2024-01-31' }, [], CurrencyCode.USD)
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.groupedBudgets).toEqual({});
    expect(mockCalculateBudgetGrouping).toHaveBeenCalled();
  });

  it('should return isLoading true when exchangeRatesMap is falsy', () => {
    setupStore({ exchangeRatesMap: null });

    const { result } = renderHook(() =>
      useBudgetGrouping({ startDate: '2024-01-01', endDate: '2024-01-31' }, [], CurrencyCode.USD)
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.groupedBudgets).toEqual({});
  });

  it('should filter budgets by period overlap', () => {
    setupStore({ budgets: [mockBudget, mockBudgetOutOfRange] });

    renderHook(() =>
      useBudgetGrouping({ startDate: '2024-01-01', endDate: '2024-01-31' }, [], CurrencyCode.USD)
    );

    // Only mockBudget should pass the filter (overlaps with Jan)
    // mockBudgetOutOfRange starts in June, doesn't overlap
    const call = mockCalculateBudgetGrouping.mock.calls[0];
    const activeBudgets = call[0];
    expect(activeBudgets).toHaveLength(1);
    expect(activeBudgets[0].id).toBe('budget-1');
  });

  it('should filter by selected categories', () => {
    setupStore({
      budgets: [mockBudget],
    });

    renderHook(() =>
      useBudgetGrouping(
        { startDate: '2024-01-01', endDate: '2024-01-31' },
        ['cat-1'],
        CurrencyCode.USD
      )
    );

    const call = mockCalculateBudgetGrouping.mock.calls[0];
    const activeBudgets = call[0];
    // Budget with type-1 belongs to cat-1, should be included
    expect(activeBudgets).toHaveLength(1);
  });

  it('should exclude budgets not matching selected categories', () => {
    setupStore({
      budgets: [mockBudget],
    });

    renderHook(() =>
      useBudgetGrouping(
        { startDate: '2024-01-01', endDate: '2024-01-31' },
        ['cat-nonexistent'],
        CurrencyCode.USD
      )
    );

    const call = mockCalculateBudgetGrouping.mock.calls[0];
    const activeBudgets = call[0];
    expect(activeBudgets).toHaveLength(0);
  });

  it('should handle different base currencies', () => {
    setupStore();

    const { result } = renderHook(() =>
      useBudgetGrouping({ startDate: '2024-01-01', endDate: '2024-01-31' }, [], CurrencyCode.VND)
    );

    expect(result.current.groupedBudgets).toBeDefined();
    // Should pass VND as base currency to calculation service
    const call = mockCalculateBudgetGrouping.mock.calls[0];
    expect(call[5]).toBe(CurrencyCode.VND);
  });

  it('should pass getCategoryById function to calculation service', () => {
    setupStore();

    renderHook(() =>
      useBudgetGrouping({ startDate: '2024-01-01', endDate: '2024-01-31' }, [], CurrencyCode.USD)
    );

    const call = mockCalculateBudgetGrouping.mock.calls[0];
    const getCategoryById = call[7];
    expect(typeof getCategoryById).toBe('function');
    expect(getCategoryById('cat-1')).toEqual(mockCategory);
    expect(getCategoryById('nonexistent')).toBeUndefined();
  });
});
