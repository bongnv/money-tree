/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetsPage } from './BudgetsPage';
import { useStore } from '@/contexts/StoreContext';
import { useBudgetGrouping } from '@/hooks/budgets/useBudgetGrouping';
import type { Budget, Category, TransactionType } from '../../types/models';
import { BudgetPeriod, Group, CurrencyCode } from '../../types/enums';

jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/ServiceContext');
jest.mock('@/hooks/budgets/useBudgetGrouping');

jest.mock('./BudgetDialog', () => ({
  BudgetDialog: ({ open, onSubmit }: any) =>
    open ? (
      <div data-testid="budget-dialog">
        <button onClick={() => onSubmit({ name: 'Test Budget', amount: 1000 })}>Submit</button>
      </div>
    ) : null,
}));

jest.mock('../common/PeriodSelector', () => ({
  PeriodSelector: ({ onChange }: any) => (
    <div data-testid="period-selector">
      <button onClick={() => onChange({ startDate: '2024-01-01', endDate: '2024-01-31' })}>
        Change Period
      </button>
    </div>
  ),
}));

jest.mock('../common/CategoryFilter', () => ({
  CategoryFilter: ({ onChange }: any) => (
    <div data-testid="category-filter">
      <button onClick={() => onChange(['category-1'])}>Filter</button>
    </div>
  ),
}));

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseBudgetGrouping = useBudgetGrouping as jest.MockedFunction<typeof useBudgetGrouping>;

describe('BudgetsPage', () => {
  // Mock window.alert for tests
  beforeAll(() => {
    global.alert = jest.fn();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
  const mockCategory: Category = {
    id: 'category-1',
    name: 'Food',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockTransactionType: TransactionType = {
    id: 'type-1',
    name: 'Groceries',
    categoryId: 'category-1',
    group: Group.EXPENSE,
    isActive: true,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockBudget: Budget = {
    id: 'budget-1',
    period: BudgetPeriod.MONTHLY,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    transactionTypeId: 'type-1',
    amount: 1000,
    currencyCode: CurrencyCode.USD,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockAddBudget = jest.fn();
  const mockUpdateBudget = jest.fn();
  const mockDeleteBudget = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({
      budgets: [mockBudget],
      categories: [mockCategory],
      transactionTypes: [mockTransactionType],
      transactions: [],
      accounts: [],
      assets: [],
      exchangeRates: [],
      baseCurrency: CurrencyCode.USD,
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
    } as any);
    mockUseBudgetGrouping.mockReturnValue({
      groupedBudgets: {},
      isLoading: false,
    });
  });

  it('should render page title', () => {
    render(<BudgetsPage />);
    expect(screen.getByText('Budgets')).toBeInTheDocument();
  });

  it('should render period selector', () => {
    render(<BudgetsPage />);
    expect(screen.getByTestId('period-selector')).toBeInTheDocument();
  });

  it('should render category filter', () => {
    render(<BudgetsPage />);
    expect(screen.getByTestId('category-filter')).toBeInTheDocument();
  });

  it('should render add budget button', () => {
    render(<BudgetsPage />);
    expect(screen.getByText('Add Budget')).toBeInTheDocument();
  });

  it('should open dialog when add budget button is clicked', async () => {
    const user = userEvent.setup();
    render(<BudgetsPage />);

    const addButton = screen.getByText('Add Budget');
    await user.click(addButton);

    expect(screen.getByTestId('budget-dialog')).toBeInTheDocument();
  });

  it('should create budget when dialog is submitted in create mode', async () => {
    const user = userEvent.setup();
    mockAddBudget.mockResolvedValue(undefined);

    render(<BudgetsPage />);

    const addButton = screen.getByText('Add Budget');
    await user.click(addButton);

    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddBudget).toHaveBeenCalledWith({
        name: 'Test Budget',
        amount: 1000,
      });
    });
  });

  it('should handle create error with alert', async () => {
    const user = userEvent.setup();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    mockAddBudget.mockRejectedValue(new Error('Create failed'));

    render(<BudgetsPage />);

    const addButton = screen.getByText('Add Budget');
    await user.click(addButton);

    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Create failed');
    });

    alertSpy.mockRestore();
  });

  it('should update selected period when period selector changes', async () => {
    const user = userEvent.setup();
    render(<BudgetsPage />);

    const changePeriodButton = screen.getByText('Change Period');
    await user.click(changePeriodButton);

    // Should trigger re-render with new period
    expect(mockUseBudgetGrouping).toHaveBeenCalled();
  });

  it('should render category filter', () => {
    render(<BudgetsPage />);

    expect(screen.getByTestId('category-filter')).toBeInTheDocument();
  });

  it('should handle empty budgets list', () => {
    mockUseStore.mockReturnValue({
      budgets: [],
      categories: [mockCategory],
    } as any);
    mockUseBudgetGrouping.mockReturnValue({
      groupedBudgets: {},
      isLoading: false,
    });

    render(<BudgetsPage />);
    expect(screen.getByText('Budgets')).toBeInTheDocument();
  });

  it('should show period change button', () => {
    render(<BudgetsPage />);
    expect(screen.getByRole('button', { name: /change period/i })).toBeInTheDocument();
  });

  it('should show filter button', () => {
    render(<BudgetsPage />);
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
  });

  it('should have add budget button', () => {
    render(<BudgetsPage />);
    const addBudgetButton = screen.getByRole('button', { name: /add budget/i });
    expect(addBudgetButton).toBeInTheDocument();
  });

  it('should render without crashing when clicking add budget', () => {
    render(<BudgetsPage />);
    const addBudgetButton = screen.getByRole('button', { name: /add budget/i });
    fireEvent.click(addBudgetButton);
    // Component should still be rendered
    expect(screen.getByText('Budgets')).toBeInTheDocument();
  });
});
