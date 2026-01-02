import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BudgetOverview } from './BudgetOverview';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { Group } from '../../types/enums';
import type { PeriodOption } from './PeriodSelector';

jest.mock('../../stores/useBudgetStore');
jest.mock('../../stores/useTransactionStore');
jest.mock('../../stores/useCategoryStore');

const mockUseBudgetStore = useBudgetStore as jest.MockedFunction<typeof useBudgetStore>;
const mockUseTransactionStore = useTransactionStore as jest.MockedFunction<
  typeof useTransactionStore
>;
const mockUseCategoryStore = useCategoryStore as jest.MockedFunction<typeof useCategoryStore>;

describe('BudgetOverview', () => {
  const mockPeriod: PeriodOption = {
    label: 'This Month',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty state when no budgets exist', () => {
    mockUseBudgetStore.mockImplementation((selector: any) => selector({ budgets: [] }));
    mockUseTransactionStore.mockImplementation((selector: any) => selector({ transactions: [] }));
    mockUseCategoryStore.mockImplementation((selector: any) =>
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

  it('displays budget progress bars', () => {
    mockUseBudgetStore.mockImplementation((selector: any) =>
      selector({
        budgets: [
          {
            id: 'budget-1',
            transactionTypeId: 'type-1',
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

    mockUseTransactionStore.mockImplementation((selector: any) =>
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

    mockUseCategoryStore.mockImplementation((selector: any) =>
      selector({
        transactionTypes: [
          {
            id: 'type-1',
            name: 'Groceries',
            categoryId: 'cat-1',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        categories: [
          {
            id: 'cat-1',
            name: 'Food',
            group: Group.EXPENSE,
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

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText(/\$300.*\$500/)).toBeInTheDocument();
  });

  it('displays "View All Budgets" link', () => {
    mockUseBudgetStore.mockImplementation((selector: any) =>
      selector({
        budgets: [
          {
            id: 'budget-1',
            transactionTypeId: 'type-1',
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

    mockUseTransactionStore.mockImplementation((selector: any) => selector({ transactions: [] }));

    mockUseCategoryStore.mockImplementation((selector: any) =>
      selector({
        transactionTypes: [
          {
            id: 'type-1',
            name: 'Groceries',
            categoryId: 'cat-1',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        categories: [
          {
            id: 'cat-1',
            name: 'Food',
            group: Group.EXPENSE,
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

    expect(screen.getByText('View All Budgets')).toBeInTheDocument();
  });

  it('displays only top 5 budgets', () => {
    mockUseBudgetStore.mockImplementation((selector: any) =>
      selector({
        budgets: Array.from({ length: 7 }, (_, i) => ({
          id: `budget-${i}`,
          transactionTypeId: `type-${i}`,
          amount: 500,
          period: 'monthly' as const,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        })),
      })
    );

    mockUseTransactionStore.mockImplementation((selector: any) =>
      selector({
        transactions: Array.from({ length: 7 }, (_, i) => ({
          id: `txn-${i}`,
          date: '2026-01-15',
          description: `Transaction ${i}`,
          amount: 300,
          transactionTypeId: `type-${i}`,
          fromAccountId: 'acc-1',
          createdAt: '2026-01-15T00:00:00.000Z',
          updatedAt: '2026-01-15T00:00:00.000Z',
        })),
      })
    );

    mockUseCategoryStore.mockImplementation((selector: any) =>
      selector({
        transactionTypes: Array.from({ length: 7 }, (_, i) => ({
          id: `type-${i}`,
          name: `Type ${i}`,
          categoryId: 'cat-1',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        })),
        categories: [
          {
            id: 'cat-1',
            name: 'Food',
            group: Group.EXPENSE,
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

    // Should only show 5 budget items
    const progressBars = screen.getAllByText(/Type \d/);
    expect(progressBars).toHaveLength(5);
  });
});
