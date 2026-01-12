import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BudgetOverview } from './BudgetOverview';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAppStore } from '../../stores/useAppStore';
import { useExchangeRateStore } from '../../stores/useExchangeRateStore';
import { Group } from '../../types/enums';
import type { PeriodOption } from '../common/PeriodSelector';

jest.mock('../../stores/useBudgetStore');
jest.mock('../../stores/useTransactionStore');
jest.mock('../../stores/useCategoryStore');
jest.mock('../../stores/useAccountStore');
jest.mock('../../stores/useAppStore');
jest.mock('../../stores/useExchangeRateStore');

describe('BudgetOverview', () => {
  const mockPeriod: PeriodOption = {
    label: 'This Month',
    value: 'thisMonth',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    (useAccountStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ accounts: [] })
    );
    (useAppStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ baseCurrency: 'USD' })
    );
    (useExchangeRateStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ getRateForMonth: jest.fn(async () => 1) })
    );
  });

  it('shows empty state when no budgets exist', () => {
    (useBudgetStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ budgets: [] })
    );
    (useTransactionStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ transactions: [] })
    );
    (useCategoryStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ transactionTypes: [], categories: [] })
    );

    render(
      <BrowserRouter>
        <BudgetOverview period={mockPeriod} />
      </BrowserRouter>
    );

    expect(screen.getByText('Set up budgets to track spending')).toBeInTheDocument();
    expect(screen.getByText('Create Budget')).toBeInTheDocument();
  });

  it('displays budget progress bars', async () => {
    (useBudgetStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        budgets: [
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
        ],
      })
    );

    (useTransactionStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        transactions: [
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
        ],
      })
    );

    (useCategoryStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        transactionTypes: [
          {
            id: 'type-1',
            name: 'Groceries',
            categoryId: 'cat-1',
            group: Group.EXPENSE,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        categories: [
          {
            id: 'cat-1',
            name: 'Food',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
    );

    (useAccountStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        accounts: [
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
        ],
      })
    );

    render(
      <BrowserRouter>
        <BudgetOverview period={mockPeriod} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });
  });

  it('renders the view all link', () => {
    (useBudgetStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ budgets: [] })
    );
    (useTransactionStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ transactions: [] })
    );
    (useCategoryStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        transactionTypes: [],
        categories: [],
      })
    );

    render(
      <BrowserRouter>
        <BudgetOverview period={mockPeriod} />
      </BrowserRouter>
    );

    expect(screen.getByText('Create Budget')).toBeInTheDocument();
  });

  it('handles budgets with different periods', async () => {
    (useBudgetStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        budgets: [
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
        ],
      })
    );

    (useTransactionStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ transactions: [] })
    );

    (useCategoryStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        transactionTypes: [
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
        ],
        categories: [],
      })
    );

    render(
      <BrowserRouter>
        <BudgetOverview period={mockPeriod} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('Gas')).toBeInTheDocument();
    });
  });
});
