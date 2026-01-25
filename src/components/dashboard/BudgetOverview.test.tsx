import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BudgetOverview } from './BudgetOverview';
import { AppProvider } from '../../contexts/AppContext';
import { Group } from '../../types/enums';
import type { PeriodOption } from '../common/PeriodSelector';
import { useBudgets } from '../../hooks/queries/useBudgets';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useCategories } from '../../hooks/queries/useCategories';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { useTransactionTypes } from '../../hooks/queries/useTransactionTypes';

// Mock Dexie hooks
jest.mock('../../hooks/queries/useBudgets');
jest.mock('../../hooks/queries/useTransactions');
jest.mock('../../hooks/queries/useCategories');
jest.mock('../../hooks/queries/useAccounts');
jest.mock('../../hooks/queries/useTransactionTypes');
jest.mock('../../hooks/queries', () => ({
  useBaseCurrency: jest.fn(() => 'USD'),
}));

// Mock services
const mockCalculationService = {
  calculateAccountBalance: jest.fn().mockReturnValue(1000),
  getActiveBudgetForPeriod: jest.fn((budgets) => budgets[0] || null),
  calculateNetWorth: jest.fn().mockResolvedValue(5000),
  prorateBudgetForPeriod: jest.fn((budget) => budget.amount),
  calculateBudgetUsage: jest.fn().mockReturnValue(0),
  convertBudgetAmount: jest.fn(async (budget) => budget.amount),
  sumTransactionAmounts: jest.fn(async (transactions) => {
    return transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
  }),
};

jest.mock('../../contexts/ServiceProviders', () => ({
  useCalculationService: () => mockCalculationService,
}));

// Mock cloudSync
jest.mock('../../services/cloudSync.service', () => ({
  getCloudSyncService: jest.fn(() => ({
    fullSync: jest.fn().mockResolvedValue(undefined),
  })),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AppProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </AppProvider>
  );
};

describe('BudgetOverview', () => {
  const mockPeriod: PeriodOption = {
    label: 'This Month',
    value: 'thisMonth',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the hooks with default values
    (useBudgets as jest.Mock).mockReturnValue([]);
    (useTransactions as jest.Mock).mockReturnValue([]);
    (useCategories as jest.Mock).mockReturnValue([]);
    (useAccounts as jest.Mock).mockReturnValue([]);
    (useTransactionTypes as jest.Mock).mockReturnValue([]);
  });

  it('shows empty state when no budgets exist', () => {
    renderWithProviders(<BudgetOverview period={mockPeriod} />);

    expect(screen.getByText('Set up budgets to track spending')).toBeInTheDocument();
    expect(screen.getByText('Create Budget')).toBeInTheDocument();
  });

  it('displays budget progress bars', async () => {
    (useBudgets as jest.Mock).mockReturnValue([
      {
        id: 'budget-1',
        transactionTypeId: 'type-1',
        currencyCode: 'USD',
        amount: 500,
        period: 'monthly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    (useTransactions as jest.Mock).mockReturnValue([
      {
        id: 'txn-1',
        date: '2026-01-15',
        description: 'Groceries',
        amount: 300,
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      },
    ]);

    (useTransactionTypes as jest.Mock).mockReturnValue([
      {
        id: 'type-1',
        name: 'Groceries',
        categoryId: 'cat-1',
        group: Group.EXPENSE,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    (useCategories as jest.Mock).mockReturnValue([
      {
        id: 'cat-1',
        name: 'Food',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    (useAccounts as jest.Mock).mockReturnValue([
      {
        id: 'acc-1',
        name: 'Checking',
        type: 'bank-account',
        currencyCode: 'USD',
        initialBalance: 1000,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    renderWithProviders(<BudgetOverview period={mockPeriod} />);

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });
  });

  it('renders the view all link', () => {
    (useBudgets as jest.Mock).mockReturnValue([]);
    (useTransactions as jest.Mock).mockReturnValue([]);
    (useTransactionTypes as jest.Mock).mockReturnValue([]);
    (useCategories as jest.Mock).mockReturnValue([]);

    renderWithProviders(<BudgetOverview period={mockPeriod} />);

    expect(screen.getByText('Create Budget')).toBeInTheDocument();
  });

  it('handles budgets with different periods', async () => {
    (useBudgets as jest.Mock).mockReturnValue([
      {
        id: 'budget-1',
        transactionTypeId: 'type-1',
        currencyCode: 'USD',
        amount: 500,
        period: 'monthly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'budget-2',
        transactionTypeId: 'type-2',
        currencyCode: 'USD',
        amount: 100,
        period: 'weekly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    (useTransactions as jest.Mock).mockReturnValue([]);

    (useTransactionTypes as jest.Mock).mockReturnValue([
      {
        id: 'type-1',
        name: 'Groceries',
        categoryId: 'cat-1',
        group: Group.EXPENSE,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'type-2',
        name: 'Gas',
        categoryId: 'cat-1',
        group: Group.EXPENSE,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    renderWithProviders(<BudgetOverview period={mockPeriod} />);

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('Gas')).toBeInTheDocument();
    });
  });
});
