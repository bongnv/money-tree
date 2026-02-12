/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { useBudgetOverview } from './useBudgetOverview';
import { useStore } from '@/contexts/StoreContext';
import { useServiceContext } from '@/contexts/ServiceContext';
import { Group, CurrencyCode, BudgetPeriod } from '@/types/enums';
import type { Budget, Transaction, TransactionType, Category, Account } from '@/types/models';

jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/ServiceContext');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseServiceContext = useServiceContext as jest.MockedFunction<typeof useServiceContext>;

describe('useBudgetOverview', () => {
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

  const mockIncomeType: TransactionType = {
    id: 'type-2',
    name: 'Salary',
    categoryId: 'cat-2',
    group: Group.INCOME,
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
    endDate: '2024-12-31',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockIncomeBudget: Budget = {
    id: 'budget-2',
    transactionTypeId: 'type-2',
    amount: 5000,
    currencyCode: CurrencyCode.USD,
    period: BudgetPeriod.MONTHLY,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockTransaction: Transaction = {
    id: 'tx-1',
    date: '2024-01-15',
    description: 'Grocery shopping',
    amount: 500,
    transactionTypeId: 'type-1',
    fromAccountId: 'acc-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isDeleted: false,
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

  const period = {
    value: 'current-month',
    label: 'Current Month',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  };

  const mockCalculationService = {
    getActiveBudgetForPeriod: jest.fn(),
    prorateBudgetForPeriod: jest.fn(),
    convertBudgetAmount: jest.fn(),
    sumTransactionAmounts: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseServiceContext.mockReturnValue({
      calculationService: mockCalculationService,
    } as any);
  });

  it('should return empty budgets when no budgets exist', () => {
    mockUseStore.mockReturnValue({
      budgets: [],
      transactions: [],
      transactionTypes: [],
      categories: [],
      accounts: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.budgets).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return isLoading true when store not loaded', () => {
    mockUseStore.mockReturnValue({
      budgets: [],
      transactions: [],
      transactionTypes: [],
      categories: [],
      accounts: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: false,
    } as any);

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.isLoading).toBe(true);
  });

  it('should return empty array when exchangeRatesMap is falsy', () => {
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      transactions: [mockTransaction],
      transactionTypes: [mockTransactionType],
      categories: [mockCategory],
      accounts: [mockAccount],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: null,
      isStoreLoaded: false,
    } as any);

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.budgets).toEqual([]);
  });

  it('should calculate budget overview with spending', () => {
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      transactions: [mockTransaction],
      transactionTypes: [mockTransactionType],
      categories: [mockCategory],
      accounts: [mockAccount],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    mockCalculationService.getActiveBudgetForPeriod.mockReturnValue(mockBudget);
    mockCalculationService.prorateBudgetForPeriod.mockReturnValue(1000);
    mockCalculationService.convertBudgetAmount.mockReturnValue(1000);
    mockCalculationService.sumTransactionAmounts.mockReturnValue(500);

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.budgets).toHaveLength(1);
    expect(result.current.budgets[0]).toEqual({
      id: 'budget-1',
      name: 'Groceries',
      spent: 500,
      budget: 1000,
      percentage: 50,
      isIncome: false,
    });
  });

  it('should identify income budgets correctly', () => {
    mockUseStore.mockReturnValue({
      budgets: [mockIncomeBudget],
      transactions: [],
      transactionTypes: [mockIncomeType],
      categories: [mockCategory],
      accounts: [mockAccount],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    mockCalculationService.getActiveBudgetForPeriod.mockReturnValue(mockIncomeBudget);
    mockCalculationService.prorateBudgetForPeriod.mockReturnValue(5000);
    mockCalculationService.convertBudgetAmount.mockReturnValue(5000);
    mockCalculationService.sumTransactionAmounts.mockReturnValue(4000);

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.budgets[0].isIncome).toBe(true);
  });

  it('should skip budgets where getActiveBudgetForPeriod returns null', () => {
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      transactions: [],
      transactionTypes: [mockTransactionType],
      categories: [mockCategory],
      accounts: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    mockCalculationService.getActiveBudgetForPeriod.mockReturnValue(null);

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.budgets).toEqual([]);
  });

  it('should skip budgets where active budget id does not match', () => {
    const differentBudget = { ...mockBudget, id: 'other-budget' };
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      transactions: [],
      transactionTypes: [mockTransactionType],
      categories: [mockCategory],
      accounts: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    mockCalculationService.getActiveBudgetForPeriod.mockReturnValue(differentBudget);

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.budgets).toEqual([]);
  });

  it('should handle zero budget amount (percentage = 0)', () => {
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      transactions: [mockTransaction],
      transactionTypes: [mockTransactionType],
      categories: [mockCategory],
      accounts: [mockAccount],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    mockCalculationService.getActiveBudgetForPeriod.mockReturnValue(mockBudget);
    mockCalculationService.prorateBudgetForPeriod.mockReturnValue(0);
    mockCalculationService.convertBudgetAmount.mockReturnValue(0);
    mockCalculationService.sumTransactionAmounts.mockReturnValue(100);

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.budgets[0].percentage).toBe(0);
  });

  it('should show "Unknown" name when transactionType not found', () => {
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      transactions: [],
      transactionTypes: [], // No matching transaction type
      categories: [],
      accounts: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    mockCalculationService.getActiveBudgetForPeriod.mockReturnValue(mockBudget);
    mockCalculationService.prorateBudgetForPeriod.mockReturnValue(1000);
    mockCalculationService.convertBudgetAmount.mockReturnValue(1000);
    mockCalculationService.sumTransactionAmounts.mockReturnValue(0);

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.budgets[0].name).toBe('Unknown');
  });

  it('should sort by percentage descending and limit to top 5', () => {
    const budgets = Array.from({ length: 7 }, (_, i) => ({
      ...mockBudget,
      id: `budget-${i}`,
      transactionTypeId: `type-${i}`,
    }));

    const types = budgets.map((_, i) => ({
      ...mockTransactionType,
      id: `type-${i}`,
      name: `Type ${i}`,
    }));

    mockUseStore.mockReturnValue({
      budgets,
      transactions: [],
      transactionTypes: types,
      categories: [mockCategory],
      accounts: [mockAccount],
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    mockCalculationService.getActiveBudgetForPeriod.mockImplementation(
      (_budgets: any, _typeId: string) => {
        return budgets.find((b) => b.transactionTypeId === _typeId);
      }
    );
    mockCalculationService.prorateBudgetForPeriod.mockReturnValue(1000);
    mockCalculationService.convertBudgetAmount.mockReturnValue(1000);
    mockCalculationService.sumTransactionAmounts.mockImplementation(() => {
      return Math.random() * 2000;
    });

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.budgets.length).toBeLessThanOrEqual(5);
    // Check sorted descending
    for (let i = 1; i < result.current.budgets.length; i++) {
      expect(result.current.budgets[i - 1].percentage).toBeGreaterThanOrEqual(
        result.current.budgets[i].percentage
      );
    }
  });

  it('should handle undefined data gracefully', () => {
    mockUseStore.mockReturnValue({
      budgets: undefined,
      transactions: undefined,
      transactionTypes: undefined,
      categories: undefined,
      accounts: undefined,
      baseCurrency: CurrencyCode.USD,
      exchangeRatesMap: undefined,
      isStoreLoaded: false,
    } as any);

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.budgets).toEqual([]);
  });
});
