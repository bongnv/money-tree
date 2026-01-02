import { render, screen } from '@testing-library/react';
import { FinancialSummary } from './FinancialSummary';
import { useAccountStore } from '../../stores/useAccountStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAssetStore } from '../../stores/useAssetStore';
import { AccountType } from '../../types/enums';
import type { PeriodOption } from './PeriodSelector';

// Mock stores
jest.mock('../../stores/useAccountStore');
jest.mock('../../stores/useTransactionStore');
jest.mock('../../stores/useAssetStore');

const mockUseAccountStore = useAccountStore as jest.MockedFunction<typeof useAccountStore>;
const mockUseTransactionStore = useTransactionStore as jest.MockedFunction<
  typeof useTransactionStore
>;
const mockUseAssetStore = useAssetStore as jest.MockedFunction<typeof useAssetStore>;

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
            currencyId: 'usd',
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
            value: 500000,
            date: '2026-01-01',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
    );
  });

  it('renders all three financial summary cards', () => {
    render(<FinancialSummary period={mockPeriod} />);

    expect(screen.getByText('Net Worth')).toBeInTheDocument();
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('Savings Rate')).toBeInTheDocument();
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

    render(<FinancialSummary period={mockPeriod} />);

    // Net worth should be $0.00, Cash Flow should be $0.00
    const amounts = screen.getAllByText('$0.00');
    expect(amounts).toHaveLength(2); // Net Worth and Cash Flow
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Savings rate
  });
});
