import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BudgetsPage } from './BudgetsPage';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import type { Budget } from '../../types/models';
import { Group } from '../../types/enums';

// Mock the stores
jest.mock('../../stores/useBudgetStore');
jest.mock('../../stores/useCategoryStore');

const mockCategories = [
  {
    id: 'cat1',
    name: 'Housing',
    group: Group.EXPENSE,
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
];

const mockBudget: Budget = {
  id: '1',
  transactionTypeId: 'tt1',
  amount: 1500,
  period: 'monthly',
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

    mockGetCategoryById.mockImplementation((id: string) => 
      mockCategories.find((c) => c.id === id)
    );

    (useCategoryStore as unknown as jest.Mock).mockReturnValue({
      categories: mockCategories,
      transactionTypes: mockTransactionTypes,
      getCategoryById: mockGetCategoryById,
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
    expect(screen.getByText('Click "Add Budget" to get started with budget planning')).toBeInTheDocument();
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

    expect(screen.getByText('Housing')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText(/\$1,?500\.00 per month/)).toBeInTheDocument();
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
    const monthlyBudget = { ...mockBudget, id: '1', period: 'monthly' as const };
    const quarterlyBudget = { ...mockBudget, id: '2', period: 'quarterly' as const, transactionTypeId: 'tt1' };
    const yearlyBudget = { ...mockBudget, id: '3', period: 'yearly' as const, transactionTypeId: 'tt1' };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue({
      budgets: [monthlyBudget, quarterlyBudget, yearlyBudget],
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
      getBudgetByTransactionTypeId: mockGetBudgetByTransactionTypeId,
    });

    render(<BudgetsPage />);

    expect(screen.getByText(/\$1,?500\.00 per month/)).toBeInTheDocument();
    expect(screen.getByText(/\$1,?500\.00 per quarter/)).toBeInTheDocument();
    expect(screen.getByText(/\$1,?500\.00 per year/)).toBeInTheDocument();
  });
});
