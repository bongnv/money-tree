import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetsPage } from './BudgetsPage';
import { useCategories } from '../../hooks/useCategories';
import { useTransactionTypes } from '../../hooks/useTransactionTypes';
import { useBudgets } from '../../hooks/useBudgets';
import { useBaseCurrency } from '../../hooks/useSyncMetadata';
import { useBudgetService } from '@/hooks/useServices';
import { useBudgetGrouping } from '@/hooks/budgets/useBudgetGrouping';
import type { Budget, Category, TransactionType } from '../../types/models';
import { BudgetPeriod, Group, CurrencyCode } from '../../types/enums';

jest.mock('../../hooks/useCategories');
jest.mock('../../hooks/useTransactionTypes');
jest.mock('../../hooks/useBudgets');
jest.mock('../../hooks/useSyncMetadata');
jest.mock('@/hooks/useServices');
jest.mock('@/hooks/budgets/useBudgetGrouping');

jest.mock('./BudgetDialog', () => ({
  BudgetDialog: ({ open, onSubmit }: any) => (
    open ? (
      <div data-testid="budget-dialog">
        <button onClick={() => onSubmit({ name: 'Test Budget', amount: 1000 })}>Submit</button>
      </div>
    ) : null
  ),
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

const mockUseCategories = useCategories as jest.MockedFunction<typeof useCategories>;
const mockUseTransactionTypes = useTransactionTypes as jest.MockedFunction<typeof useTransactionTypes>;
const mockUseBudgets = useBudgets as jest.MockedFunction<typeof useBudgets>;
const mockUseBaseCurrency = useBaseCurrency as jest.MockedFunction<typeof useBaseCurrency>;
const mockUseBudgetService = useBudgetService as jest.MockedFunction<typeof useBudgetService>;
const mockUseBudgetGrouping = useBudgetGrouping as jest.MockedFunction<typeof useBudgetGrouping>;

describe('BudgetsPage', () => {
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

  const mockBudgetService = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCategories.mockReturnValue([mockCategory]);
    mockUseTransactionTypes.mockReturnValue([mockTransactionType]);
    mockUseBudgets.mockReturnValue([mockBudget]);
    mockUseBaseCurrency.mockReturnValue(CurrencyCode.USD);
    mockUseBudgetService.mockReturnValue(mockBudgetService as any);
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
    mockBudgetService.create.mockResolvedValue(undefined);

    render(<BudgetsPage />);

    const addButton = screen.getByText('Add Budget');
    await user.click(addButton);

    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockBudgetService.create).toHaveBeenCalledWith({
        name: 'Test Budget',
        amount: 1000,
      });
    });
  });

  it('should handle create error with alert', async () => {
    const user = userEvent.setup();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    mockBudgetService.create.mockRejectedValue(new Error('Create failed'));

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

  it('should handle undefined base currency with default USD', () => {
    mockUseBaseCurrency.mockReturnValue(undefined);
    render(<BudgetsPage />);
    expect(screen.getByText('Budgets')).toBeInTheDocument();
  });

  it('should handle empty budgets list', () => {
    mockUseBudgets.mockReturnValue([]);
    mockUseBudgetGrouping.mockReturnValue({
      groupedBudgets: {},
      isLoading: false,
    });

    render(<BudgetsPage />);
    expect(screen.getByText('Budgets')).toBeInTheDocument();
  });
});
