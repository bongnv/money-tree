import { renderHook, act } from '@testing-library/react';
import { useBudgetPerformance } from './useBudgetPerformance';
import { useStore } from '@/contexts/StoreContext';
import { CurrencyCode, BudgetPeriod, Group } from '@/types/enums';
import type { Budget, TransactionType, Category, Account } from '@/types/models';

jest.mock('@/contexts/StoreContext');
jest.mock('../useServices', () => ({
  useReportService: jest.fn(() => ({
    calculateBudgetPerformance: jest.fn(() => []),
  })),
}));

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate budget performance', () => {
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      transactions: [],
      transactionTypes: [mockTransactionType],
      categories: [mockCategory],
      accounts: [mockAccount],
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    const { result } = renderHook(() => useBudgetPerformance());

    expect(result.current.budgetPerformance).toBeDefined();
    expect(result.current.startDate).toBeDefined();
    expect(result.current.endDate).toBeDefined();
  });

  it('should have date range properties', () => {
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      transactions: [],
      transactionTypes: [mockTransactionType],
      categories: [mockCategory],
      accounts: [mockAccount],
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    const { result } = renderHook(() => useBudgetPerformance());

    expect(result.current.startDate).toBeDefined();
    expect(result.current.endDate).toBeDefined();
  });

  it('should allow changing conversion currency', () => {
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      transactions: [],
      transactionTypes: [mockTransactionType],
      categories: [mockCategory],
      accounts: [mockAccount],
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    const { result } = renderHook(() => useBudgetPerformance());

    act(() => {
      result.current.setConversionCurrency(CurrencyCode.AUD);
    });

    expect(result.current.conversionCurrency).toBe(CurrencyCode.AUD);
  });

  it('should handle undefined data', () => {
    mockUseStore.mockReturnValue({
      budgets: undefined,
      transactions: undefined,
      transactionTypes: undefined,
      categories: undefined,
      accounts: undefined,
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    const { result } = renderHook(() => useBudgetPerformance());

    expect(result.current.budgetPerformance).toBeDefined();
  });
});
