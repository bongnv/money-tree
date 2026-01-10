import { render, screen } from '@testing-library/react';
import { FinancialSummary } from './FinancialSummary';
import { useAccountStore } from '../../stores/useAccountStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAssetStore } from '../../stores/useAssetStore';
import { useAppStore } from '../../stores/useAppStore';
import { useExchangeRateStore } from '../../stores/useExchangeRateStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { AccountType, Group, BudgetPeriod } from '../../types/enums';
import type { PeriodOption } from '../common/PeriodSelector';

// Mock stores
jest.mock('../../stores/useAccountStore');
jest.mock('../../stores/useTransactionStore');
jest.mock('../../stores/useAssetStore');
jest.mock('../../stores/useAppStore');
jest.mock('../../stores/useExchangeRateStore');
jest.mock('../../stores/useCategoryStore');
jest.mock('../../stores/useBudgetStore');

const mockUseAccountStore = useAccountStore as jest.MockedFunction<typeof useAccountStore>;
const mockUseTransactionStore = useTransactionStore as jest.MockedFunction<
  typeof useTransactionStore
>;
const mockUseAssetStore = useAssetStore as jest.MockedFunction<typeof useAssetStore>;
const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;
const mockUseExchangeRateStore = useExchangeRateStore as jest.MockedFunction<
  typeof useExchangeRateStore
>;
const mockUseCategoryStore = useCategoryStore as jest.MockedFunction<typeof useCategoryStore>;
const mockUseBudgetStore = useBudgetStore as jest.MockedFunction<typeof useBudgetStore>;

describe('FinancialSummary', () => {
  const mockPeriod: PeriodOption = {
    label: 'This Month',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseAccountStore.mockImplementation((selector: any) =>
      selector({
        accounts: [
          {
            id: 'acc-1',
            name: 'Checking',
            type: AccountType.BANK_ACCOUNT,
            currencyCode: 'USD',
            initialBalance: 1000,
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
    );

    mockUseTransactionStore.mockImplementation((selector: any) =>
      selector({
        transactions: [
          {
            id: 'txn-1',
            date: '2026-01-15',
            description: 'Salary',
            amount: 3000,
            transactionTypeId: 'type-income',
            toAccountId: 'acc-1',
            createdAt: '2026-01-15T00:00:00.000Z',
            updatedAt: '2026-01-15T00:00:00.000Z',
          },
          {
            id: 'txn-2',
            date: '2026-01-20',
            description: 'Groceries',
            amount: 500,
            transactionTypeId: 'type-expense',
            fromAccountId: 'acc-1',
            createdAt: '2026-01-20T00:00:00.000Z',
            updatedAt: '2026-01-20T00:00:00.000Z',
          },
        ],
      })
    );

    mockUseAssetStore.mockImplementation((selector: any) =>
      selector({
        manualAssets: [
          {
            id: 'asset-1',
            name: 'House',
            type: 'real-estate' as const,
            currencyCode: 'USD',
            valueHistory: [{ date: '2026-01-01', value: 500000 }],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
    );

    mockUseAppStore.mockImplementation((selector: any) =>
      selector({
        baseCurrency: null,
      })
    );

    mockUseExchangeRateStore.mockImplementation((selector: any) =>
      selector({
        getRateForMonth: jest.fn(() => 1),
        fetchRateIfMissing: jest.fn(() => Promise.resolve(1)),
      })
    );

    mockUseCategoryStore.mockImplementation((selector: any) =>
      selector({
        categories: [
          {
            id: 'cat-income',
            name: 'Income',
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'cat-expense',
            name: 'Expense',
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        transactionTypes: [
          {
            id: 'type-income',
            name: 'Salary',
            group: Group.INCOME,
            categoryId: 'cat-income',
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'type-expense',
            name: 'Groceries',
            group: Group.EXPENSE,
            categoryId: 'cat-expense',
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
    );

    mockUseBudgetStore.mockImplementation((selector: any) =>
      selector({
        budgets: [
          {
            id: 'budget-1',
            transactionTypeId: 'type-income',
            amount: 5000,
            period: BudgetPeriod.MONTHLY,
            currencyCode: 'USD',
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'budget-2',
            transactionTypeId: 'type-expense',
            amount: 500,
            period: BudgetPeriod.MONTHLY,
            currencyCode: 'USD',
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
    );
  });

  it('renders all four financial summary cards', () => {
    render(<FinancialSummary period={mockPeriod} />);

    expect(screen.getByText('Net Worth')).toBeInTheDocument();
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('Savings Rate')).toBeInTheDocument();
    expect(screen.getByText('Budget Health')).toBeInTheDocument();
  });

  it('calculates and displays net worth correctly', () => {
    render(<FinancialSummary period={mockPeriod} />);

    // acc-1: 1000 + 3000 - 500 = 3500
    // asset: 500000
    // total: 503500
    expect(screen.getByText('$503,500.00')).toBeInTheDocument();
  });

  it('calculates and displays cash flow correctly', () => {
    render(<FinancialSummary period={mockPeriod} />);

    // income - expenses: 3000 - 500 = 2500
    expect(screen.getByText('$2,500.00')).toBeInTheDocument();
  });

  it('calculates and displays savings rate correctly', () => {
    render(<FinancialSummary period={mockPeriod} />);

    // (3000 - 500) / 3000 * 100 = 83.3%
    expect(screen.getByText('83.3%')).toBeInTheDocument();
  });

  it('filters transactions by period', () => {
    mockUseTransactionStore.mockImplementation((selector: any) =>
      selector({
        transactions: [
          {
            id: 'txn-1',
            date: '2026-01-15',
            description: 'Salary',
            amount: 3000,
            transactionTypeId: 'type-income',
            toAccountId: 'acc-1',
            createdAt: '2026-01-15T00:00:00.000Z',
            updatedAt: '2026-01-15T00:00:00.000Z',
          },
          {
            id: 'txn-2',
            date: '2026-02-20',
            description: 'Groceries',
            amount: 500,
            transactionTypeId: 'type-expense',
            fromAccountId: 'acc-1',
            createdAt: '2026-02-20T00:00:00.000Z',
            updatedAt: '2026-02-20T00:00:00.000Z',
          },
        ],
      })
    );

    render(<FinancialSummary period={mockPeriod} />);

    // Only txn-1 is in period, so cash flow = 3000 - 0 = 3000
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
  });

  it('handles zero income correctly', () => {
    mockUseTransactionStore.mockImplementation((selector: any) =>
      selector({
        transactions: [
          {
            id: 'txn-1',
            date: '2026-01-20',
            description: 'Groceries',
            amount: 500,
            transactionTypeId: 'type-expense',
            fromAccountId: 'acc-1',
            createdAt: '2026-01-20T00:00:00.000Z',
            updatedAt: '2026-01-20T00:00:00.000Z',
          },
        ],
      })
    );

    render(<FinancialSummary period={mockPeriod} />);

    // savings rate with zero income should be 0%
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('handles negative cash flow', () => {
    mockUseTransactionStore.mockImplementation((selector: any) =>
      selector({
        transactions: [
          {
            id: 'txn-1',
            date: '2026-01-15',
            description: 'Salary',
            amount: 100,
            transactionTypeId: 'type-income',
            toAccountId: 'acc-1',
            createdAt: '2026-01-15T00:00:00.000Z',
            updatedAt: '2026-01-15T00:00:00.000Z',
          },
          {
            id: 'txn-2',
            date: '2026-01-20',
            description: 'Groceries',
            amount: 500,
            transactionTypeId: 'type-expense',
            fromAccountId: 'acc-1',
            createdAt: '2026-01-20T00:00:00.000Z',
            updatedAt: '2026-01-20T00:00:00.000Z',
          },
        ],
      })
    );

    render(<FinancialSummary period={mockPeriod} />);

    // income - expenses: 100 - 500 = -400
    expect(screen.getByText('-$400.00')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    mockUseAccountStore.mockImplementation((selector: any) => selector({ accounts: [] }));
    mockUseTransactionStore.mockImplementation((selector: any) => selector({ transactions: [] }));
    mockUseAssetStore.mockImplementation((selector: any) => selector({ manualAssets: [] }));
    mockUseBudgetStore.mockImplementation((selector: any) => selector({ budgets: [] }));

    render(<FinancialSummary period={mockPeriod} />);

    // Net worth, Cash Flow, and Budget Health should be $0.00 or 0%
    const amounts = screen.getAllByText('$0.00');
    expect(amounts).toHaveLength(2); // Net Worth and Cash Flow
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Savings rate
    expect(screen.getByText('100%')).toBeInTheDocument(); // Budget health (100 when no budgets)
  });
});
