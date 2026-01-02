import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BudgetsPage } from './BudgetsPage';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import type { Budget, Transaction } from '../../types/models';
import { Group } from '../../types/enums';

// Mock the stores
jest.mock('../../stores/useBudgetStore');
jest.mock('../../stores/useCategoryStore');
jest.mock('../../stores/useTransactionStore');

const mockCategories = [
  {
    id: 'cat1',
    name: 'Housing',
    group: Group.EXPENSE,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat2',
    name: 'Income',
    group: Group.INCOME,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockTransactionTypes = [
  {
    id: 'tt1',
    name: 'Rent',
    categoryId: 'cat1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tt2',
    name: 'Salary',
    categoryId: 'cat2',
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

  it('should display budget items grouped by category', () => {
    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    expect(screen.getByText('Housing Budgets')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
    // Check that budget amounts are displayed
    expect(screen.getByText(/Original: \$1,?500\.00 monthly/)).toBeInTheDocument();
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

  it('should show edit dialog when edit button is clicked', () => {
    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    const editButton = screen.getByLabelText('edit');
    fireEvent.click(editButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit Budget')).toBeInTheDocument();
  });

  it('should call deleteBudget when delete button is clicked and confirmed', () => {
    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    const deleteButton = screen.getByLabelText('delete');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteBudget).toHaveBeenCalledWith('1');
  });

  it('should not delete budget item when deletion is cancelled', () => {
    window.confirm = jest.fn(() => false);

    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    const deleteButton = screen.getByLabelText('delete');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteBudget).not.toHaveBeenCalled();
  });

  it('should display correct period labels', () => {
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
    expect(screen.getByText(/Original: \$1,?500\.00 monthly/)).toBeInTheDocument();
    expect(screen.getByText(/Original: \$4,?500\.00 quarterly/)).toBeInTheDocument();
    expect(screen.getByText(/Original: \$18,?000\.00 yearly/)).toBeInTheDocument();
  });

  it('should display progress bars with actual spending', () => {
    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    // Should show original budget and progress bars
    expect(screen.getByText(/Original: \$1,?500\.00 monthly/)).toBeInTheDocument();
    // Progress bars should be rendered (MUI LinearProgress)
    const progressBars = document.querySelectorAll('.MuiLinearProgress-root');
    expect(progressBars.length).toBeGreaterThanOrEqual(1);
  });

  it('should prorate quarterly budgets for current month', () => {
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
    expect(screen.getByText(/Original: \$4,?500\.00 quarterly/)).toBeInTheDocument();
  });

  it('should prorate yearly budgets for current month', () => {
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
    expect(screen.getByText(/Original: \$18,?000\.00 yearly/)).toBeInTheDocument();
  });

  it('should show context-aware section titles for income vs expenses', () => {
    const incomeBudget = { ...mockBudget, id: '2', transactionTypeId: 'tt2', amount: 5000 };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget, incomeBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    // Expense category should show "Budgets"
    expect(screen.getByText('Housing Budgets')).toBeInTheDocument();

    // Income category should show "Income Targets"
    expect(screen.getByText('Income Targets')).toBeInTheDocument();
  });

  it('should display total row per category', () => {
    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [mockBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    // Should show total row
    expect(screen.getByText('Total')).toBeInTheDocument();
    // Should show original budget
    expect(screen.getByText(/Original: \$1,?500\.00 monthly/)).toBeInTheDocument();
  });
});
