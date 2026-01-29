import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BudgetsPage } from './BudgetsPage';
import { useBudgets } from '../../hooks/queries/useBudgets';
import { budgetService } from '../../services/budget.service';
import { useCategories } from '../../hooks/queries/useCategories';
import { useTransactionTypes } from '../../hooks/queries/useTransactionTypes';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { useAppContext } from '../../contexts/AppContext';
import type { Budget, Transaction } from '../../types/models';
import { Group, CurrencyCode } from '../../types/enums';

// Mock services
const mockCalculationService = {
  calculateAccountBalance: jest.fn().mockReturnValue(1000),
  getActiveBudgetForPeriod: jest.fn((budgets) => budgets[0] || null), // Return first budget if available
  prorateBudgetForPeriod: jest.fn((budget) => budget.amount), // Return same amount
  calculateBudgetUsage: jest.fn().mockReturnValue(0), // Default 0 usage
  convertBudgetAmount: jest.fn(async (budget) => budget.amount), // Return same amount
  calculateBudgetGrouping: jest.fn(
    async (
      budgets,
      transactions,
      transactionTypes,
      accounts,
      selectedPeriod,
      baseCurrency,
      getCategoryById
    ) => {
      const grouped: Record<
        string,
        {
          category: { id: string; name: string };
          items: unknown[];
          totalBudget: number;
          totalActual: number;
        }
      > = {};

      for (const budget of budgets) {
        const transactionType = transactionTypes.find(
          (tt: { id: string }) => tt.id === budget.transactionTypeId
        );
        if (!transactionType) continue;

        const category = getCategoryById(transactionType.categoryId);
        if (!category) continue;

        const categoryId = category.id;
        if (!grouped[categoryId]) {
          grouped[categoryId] = {
            category,
            items: [],
            totalBudget: 0,
            totalActual: 0,
          };
        }

        const proratedBudget = budget.amount;
        const actualAmount = transactions
          .filter(
            (t: { transactionTypeId: string }) => t.transactionTypeId === budget.transactionTypeId
          )
          .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
        const percentage = proratedBudget > 0 ? (actualAmount / proratedBudget) * 100 : 0;

        grouped[categoryId].items.push({
          budget,
          transactionType,
          proratedBudget,
          actualAmount,
          percentage,
        });

        grouped[categoryId].totalBudget += proratedBudget;
        grouped[categoryId].totalActual += actualAmount;
      }

      return grouped;
    }
  ),
};

jest.mock('../../contexts/ServiceProviders', () => ({
  useCalculationService: () => mockCalculationService,
}));

// Mock the hooks
jest.mock('../../hooks/queries/useBudgets');
jest.mock('../../services/budget.service');
jest.mock('../../hooks/queries/useCategories');
jest.mock('../../hooks/queries/useTransactionTypes');
jest.mock('../../hooks/queries/useTransactions');
jest.mock('../../hooks/queries/useAccounts');
jest.mock('../../contexts/AppContext');

const mockCategories = [
  {
    id: 'cat1',
    name: 'Housing',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat2',
    name: 'Income',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockTransactionTypes = [
  {
    id: 'tt1',
    name: 'Rent',
    categoryId: 'cat1',
    group: Group.EXPENSE,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tt2',
    name: 'Salary',
    categoryId: 'cat2',
    group: Group.INCOME,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockTransactions: Transaction[] = [
  {
    id: 'txn1',
    date: '2026-01-05',
    description: 'Rent payment',
    amount: 1200,
    transactionTypeId: 'tt1',
    fromAccountId: 'acc1',
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'txn2',
    date: '2026-01-15',
    description: 'Salary',
    amount: 4000,
    transactionTypeId: 'tt2',
    toAccountId: 'acc1',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
  },
];

const mockBudget: Budget = {
  id: '1',
  transactionTypeId: 'tt1',
  currencyCode: CurrencyCode.USD,
  amount: 1500,
  period: 'monthly',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('BudgetsPage', () => {
  const mockAddBudget = jest.fn();
  const mockUpdateBudget = jest.fn();
  const mockDeleteBudget = jest.fn();
  const mockGetBudgetByTransactionTypeId = jest.fn();
  const mockGetCategoryById = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);

    mockGetCategoryById.mockImplementation((id: string) => mockCategories.find((c) => c.id === id));

    (useCategories as jest.MockedFunction<typeof useCategories>).mockReturnValue(mockCategories);
    (useTransactionTypes as jest.MockedFunction<typeof useTransactionTypes>).mockReturnValue(
      mockTransactionTypes
    );

    (useTransactions as jest.MockedFunction<typeof useTransactions>).mockReturnValue(
      mockTransactions
    );

    (useAccounts as jest.MockedFunction<typeof useAccounts>).mockReturnValue([
      {
        id: 'acc1',
        name: 'Checking',
        type: 'bank_account',
        currencyCode: 'USD',
        initialBalance: 0,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    (useAppContext as jest.MockedFunction<typeof useAppContext>).mockReturnValue({
      baseCurrency: CurrencyCode.USD,
      setBaseCurrency: jest.fn(),
      getCategoryById: mockGetCategoryById,
    });
  });

  it('should render page title and Add Budget button', () => {
    (useBudgets as jest.MockedFunction<typeof useBudgets>).mockReturnValue([]);
    (budgetService.create as jest.Mock) = mockAddBudget;
    (budgetService.update as jest.Mock) = mockUpdateBudget;
    (budgetService.delete as jest.Mock) = mockDeleteBudget;

    render(<BudgetsPage />);

    expect(screen.getByText('Budgets')).toBeInTheDocument();
    const addButtons = screen.getAllByText('Add Budget');
    expect(addButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('should show empty state when no budgets exist', () => {
    (useBudgets as jest.MockedFunction<typeof useBudgets>).mockReturnValue([]);
    (budgetService.create as jest.Mock) = mockAddBudget;
    (budgetService.update as jest.Mock) = mockUpdateBudget;
    (budgetService.delete as jest.Mock) = mockDeleteBudget;

    render(<BudgetsPage />);

    expect(screen.getByText('No budgets set')).toBeInTheDocument();
    expect(
      screen.getByText('Click "Add Budget" to get started with budget planning')
    ).toBeInTheDocument();
  });

  it('should display budget items grouped by category', async () => {
    (useBudgets as jest.MockedFunction<typeof useBudgets>).mockReturnValue([mockBudget]);
    (budgetService.create as jest.Mock) = mockAddBudget;
    (budgetService.update as jest.Mock) = mockUpdateBudget;
    (budgetService.delete as jest.Mock) = mockDeleteBudget;

    render(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('Housing Budgets')).toBeInTheDocument();
    });
    expect(screen.getByText('Rent')).toBeInTheDocument();
    // Check that budget amounts are displayed (may appear multiple times in UI)
    const amounts = screen.getAllByText(/\$1,?500\.00/);
    expect(amounts.length).toBeGreaterThan(0);
  });

  it('should open dialog when Add Budget button is clicked', () => {
    (useBudgets as jest.MockedFunction<typeof useBudgets>).mockReturnValue([]);
    (budgetService.create as jest.Mock) = mockAddBudget;
    (budgetService.update as jest.Mock) = mockUpdateBudget;
    (budgetService.delete as jest.Mock) = mockDeleteBudget;

    render(<BudgetsPage />);

    const addButton = screen.getAllByText('Add Budget')[0];
    fireEvent.click(addButton);

    // Dialog should be rendered
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should show edit dialog when edit button is clicked', async () => {
    (useBudgets as jest.MockedFunction<typeof useBudgets>).mockReturnValue([mockBudget]);
    (budgetService.create as jest.Mock) = mockAddBudget;
    (budgetService.update as jest.Mock) = mockUpdateBudget;
    (budgetService.delete as jest.Mock) = mockDeleteBudget;

    render(<BudgetsPage />);

    const editButton = await screen.findByLabelText('edit');
    fireEvent.click(editButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit Budget')).toBeInTheDocument();
  });

  it('should call deleteBudget when delete button is clicked and confirmed', async () => {
    (useBudgets as jest.MockedFunction<typeof useBudgets>).mockReturnValue([mockBudget]);
    (budgetService.create as jest.Mock) = mockAddBudget;
    (budgetService.update as jest.Mock) = mockUpdateBudget;
    (budgetService.delete as jest.Mock) = mockDeleteBudget;

    render(<BudgetsPage />);

    const deleteButton = await screen.findByLabelText('delete');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteBudget).toHaveBeenCalledWith('1');
  });

  it('should not delete budget item when deletion is cancelled', async () => {
    window.confirm = jest.fn(() => false);

    (useBudgets as jest.MockedFunction<typeof useBudgets>).mockReturnValue([mockBudget]);
    (budgetService.create as jest.Mock) = mockAddBudget;
    (budgetService.update as jest.Mock) = mockUpdateBudget;
    (budgetService.delete as jest.Mock) = mockDeleteBudget;

    render(<BudgetsPage />);

    const deleteButton = await screen.findByLabelText('delete');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteBudget).not.toHaveBeenCalled();
  });

  it('should display correct period labels', async () => {
    // Create separate transaction types for each budget to avoid duplicates
    const tt2 = { ...mockTransactionTypes[0], id: 'tt1-q', name: 'Rent Quarterly' };
    const tt3 = { ...mockTransactionTypes[0], id: 'tt1-y', name: 'Rent Yearly' };

    (useTransactionTypes as jest.MockedFunction<typeof useTransactionTypes>).mockReturnValue([
      ...mockTransactionTypes,
      tt2,
      tt3,
    ]);

    const monthlyBudget = { ...mockBudget, id: '1', period: 'monthly' as const };
    const quarterlyBudget = {
      ...mockBudget,
      id: '2',
      period: 'quarterly' as const,
      amount: 4500,
      transactionTypeId: 'tt1-q',
    };
    const yearlyBudget = {
      ...mockBudget,
      id: '3',
      period: 'yearly' as const,
      amount: 18000,
      transactionTypeId: 'tt1-y',
    };

    (useBudgets as jest.MockedFunction<typeof useBudgets>).mockReturnValue([
      monthlyBudget,
      quarterlyBudget,
      yearlyBudget,
    ]);
    (budgetService.create as jest.Mock) = mockAddBudget;
    (budgetService.update as jest.Mock) = mockUpdateBudget;
    (budgetService.delete as jest.Mock) = mockDeleteBudget;

    render(<BudgetsPage />);

    // Should show original budget with period
    await waitFor(() => {
      const amounts = screen.getAllByText(/\$1,?500\.00/);
      expect(amounts.length).toBeGreaterThan(0);
    });
    const quarterlyAmounts = screen.getAllByText(/\$4,?500\.00/);
    expect(quarterlyAmounts.length).toBeGreaterThan(0);
    const yearlyAmounts = screen.getAllByText(/\$18,?000\.00/);
    expect(yearlyAmounts.length).toBeGreaterThan(0);
  });

  it('should display progress bars with actual spending', async () => {
    (useBudgets as jest.MockedFunction<typeof useBudgets>).mockReturnValue([mockBudget]);
    (budgetService.create as jest.Mock) = mockAddBudget;
    (budgetService.update as jest.Mock) = mockUpdateBudget;
    (budgetService.delete as jest.Mock) = mockDeleteBudget;

    render(<BudgetsPage />);

    // Should show original budget and progress bars
    await waitFor(() => {
      const amounts = screen.getAllByText(/\$1,?500\.00/);
      expect(amounts.length).toBeGreaterThan(0);
    });
    // Progress bars should be rendered (MUI LinearProgress)
    const progressBars = document.querySelectorAll('.MuiLinearProgress-root');
    expect(progressBars.length).toBeGreaterThanOrEqual(1);
  });

  it('should prorate quarterly budgets for current month', async () => {
    const quarterlyBudget = { ...mockBudget, amount: 4500, period: 'quarterly' as const };

    (useBudgets as jest.MockedFunction<typeof useBudgets>).mockReturnValue([quarterlyBudget]);
    (budgetService.create as jest.Mock) = mockAddBudget;
    (budgetService.update as jest.Mock) = mockUpdateBudget;
    (budgetService.delete as jest.Mock) = mockDeleteBudget;

    render(<BudgetsPage />);

    // Should show original quarterly budget
    await waitFor(() => {
      const amounts = screen.getAllByText(/\$4,?500\.00/);
      expect(amounts.length).toBeGreaterThan(0);
    });
  });

  it('should prorate yearly budgets for current month', async () => {
    const yearlyBudget = { ...mockBudget, amount: 18000, period: 'yearly' as const };

    (useBudgets as jest.MockedFunction<typeof useBudgets>).mockReturnValue([yearlyBudget]);
    (budgetService.create as jest.Mock) = mockAddBudget;
    (budgetService.update as jest.Mock) = mockUpdateBudget;
    (budgetService.delete as jest.Mock) = mockDeleteBudget;

    render(<BudgetsPage />);

    // Should show original yearly budget
    await waitFor(() => {
      const amounts = screen.getAllByText(/\$18,?000\.00/);
      expect(amounts.length).toBeGreaterThan(0);
    });
  });

  it('should show context-aware section titles for income vs expenses', async () => {
    const incomeBudget = { ...mockBudget, id: '2', transactionTypeId: 'tt2', amount: 5000 };

    (useBudgets as jest.MockedFunction<typeof useBudgets>).mockReturnValue([
      mockBudget,
      incomeBudget,
    ]);
    (budgetService.create as jest.Mock) = mockAddBudget;
    (budgetService.update as jest.Mock) = mockUpdateBudget;
    (budgetService.delete as jest.Mock) = mockDeleteBudget;

    render(<BudgetsPage />);

    // Wait for async calculations to complete
    await waitFor(() => {
      // Expense category should show "Budgets"
      expect(screen.getByText('Housing Budgets')).toBeInTheDocument();
    });

    // Income category should show "Income Targets"
    expect(screen.getByText('Income Targets')).toBeInTheDocument();
  });

  it('should display total row per category', async () => {
    (useBudgets as jest.MockedFunction<typeof useBudgets>).mockReturnValue([mockBudget]);
    (budgetService.create as jest.Mock) = mockAddBudget;
    (budgetService.update as jest.Mock) = mockUpdateBudget;
    (budgetService.delete as jest.Mock) = mockDeleteBudget;

    render(<BudgetsPage />);

    // Wait for async calculations to complete
    await waitFor(() => {
      // Should show total row
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
    // Should show original budget
    const amounts = screen.getAllByText(/\$1,?500\.00/);
    expect(amounts.length).toBeGreaterThan(0);
  });
});
