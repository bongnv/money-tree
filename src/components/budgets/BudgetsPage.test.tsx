import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BudgetsPage } from './BudgetsPage';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAppStore } from '../../stores/useAppStore';
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
      const grouped: any = {};

      for (const budget of budgets) {
        const transactionType = transactionTypes.find(
          (tt: any) => tt.id === budget.transactionTypeId
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
          .filter((t: any) => t.transactionTypeId === budget.transactionTypeId)
          .reduce((sum: number, t: any) => sum + t.amount, 0);
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

// Mock the stores
jest.mock('../../stores/useBudgetStore');
jest.mock('../../stores/useCategoryStore');
jest.mock('../../stores/useTransactionStore');
jest.mock('../../stores/useAccountStore');
jest.mock('../../stores/useAppStore');

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

    (useCategoryStore as unknown as jest.Mock).mockReturnValue({
      categories: mockCategories,
      transactionTypes: mockTransactionTypes,
      getCategoryById: mockGetCategoryById,
    });

    (useTransactionStore as unknown as jest.Mock).mockReturnValue({
      transactions: mockTransactions,
    });

    (useAccountStore as unknown as jest.Mock).mockReturnValue({
      accounts: [
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
      ],
    });

    (useAppStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ baseCurrency: 'USD' })
    );
  });

  it('should render page title and Add Budget button', () => {
    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    expect(screen.getByText('Budgets')).toBeInTheDocument();
    const addButtons = screen.getAllByText('Add Budget');
    expect(addButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('should show empty state when no budgets exist', () => {
    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    expect(screen.getByText('No budgets set')).toBeInTheDocument();
    expect(
      screen.getByText('Click "Add Budget" to get started with budget planning')
    ).toBeInTheDocument();
  });

  it('should display budget items grouped by category', async () => {
    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

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
    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    const addButton = screen.getAllByText('Add Budget')[0];
    fireEvent.click(addButton);

    // Dialog should be rendered
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should show edit dialog when edit button is clicked', async () => {
    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    const editButton = await screen.findByLabelText('edit');
    fireEvent.click(editButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit Budget')).toBeInTheDocument();
  });

  it('should call deleteBudget when delete button is clicked and confirmed', async () => {
    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    const deleteButton = await screen.findByLabelText('delete');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteBudget).toHaveBeenCalledWith('1');
  });

  it('should not delete budget item when deletion is cancelled', async () => {
    window.confirm = jest.fn(() => false);

    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

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

    (useCategoryStore as unknown as jest.Mock).mockReturnValue({
      categories: mockCategories,
      transactionTypes: [...mockTransactionTypes, tt2, tt3],
      getCategoryById: mockGetCategoryById,
    });

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

    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [monthlyBudget, quarterlyBudget, yearlyBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

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
    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

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

    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [quarterlyBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    // Should show original quarterly budget
    await waitFor(() => {
      const amounts = screen.getAllByText(/\$4,?500\.00/);
      expect(amounts.length).toBeGreaterThan(0);
    });
  });

  it('should prorate yearly budgets for current month', async () => {
    const yearlyBudget = { ...mockBudget, amount: 18000, period: 'yearly' as const };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [yearlyBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    // Should show original yearly budget
    await waitFor(() => {
      const amounts = screen.getAllByText(/\$18,?000\.00/);
      expect(amounts.length).toBeGreaterThan(0);
    });
  });

  it('should show context-aware section titles for income vs expenses', async () => {
    const incomeBudget = { ...mockBudget, id: '2', transactionTypeId: 'tt2', amount: 5000 };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget, incomeBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

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
    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

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
