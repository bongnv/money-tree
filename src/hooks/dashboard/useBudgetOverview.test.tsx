import { renderHook } from '@testing-library/react';
import { useBudgetOverview } from './useBudgetOverview';
import { useStore } from '@/contexts/StoreContext';
import { Group, CurrencyCode, BudgetPeriod } from '@/types/enums';
import type { Budget, Transaction, TransactionType, Category, Account } from '@/types/models';

jest.mock('@/contexts/StoreContext');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty budgets when no budgets exist', () => {
    mockUseStore.mockReturnValue({
      budgets: [],
      transactions: [],
      transactionTypes: [],
      categories: [],
      accounts: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    const period = {
      value: 'current-month',
      label: 'Current Month',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.budgetsWithUsage).toEqual([]);
  });

  it('should calculate budget overview with spending', () => {
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      transactions: [mockTransaction],
      transactionTypes: [mockTransactionType],
      categories: [mockCategory],
      accounts: [mockAccount],
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    const period = {
      value: 'current-month',
      label: 'Current Month',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.budgetsWithUsage).toBeDefined();
    expect(Array.isArray(result.current.budgetsWithUsage)).toBe(true);
  });

  it('should handle budgets without matching transaction types', () => {
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      transactions: [],
      transactionTypes: [],
      categories: [],
      accounts: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    const period = {
      value: 'current-month',
      label: 'Current Month',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.budgetsWithUsage).toBeDefined();
  });

  it('should handle undefined data gracefully', () => {
    mockUseStore.mockReturnValue({
      budgets: undefined,
      transactions: undefined,
      transactionTypes: undefined,
      categories: undefined,
      accounts: undefined,
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    const period = {
      value: 'current-month',
      label: 'Current Month',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    const { result } = renderHook(() => useBudgetOverview(period, CurrencyCode.USD));

    expect(result.current.isLoading).toBe(true);
  });
});
