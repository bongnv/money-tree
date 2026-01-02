import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetDialog } from './BudgetDialog';
import { useCategoryStore } from '../../stores/useCategoryStore';
import type { Budget } from '../../types/models';
import { Group } from '../../types/enums';

// Mock the category store
jest.mock('../../stores/useCategoryStore');

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
    name: 'Food',
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
  {
    id: 'tt2',
    name: 'Groceries',
    categoryId: 'cat2',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('BudgetDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCategoryStore as unknown as jest.Mock).mockReturnValue({
      categories: mockCategories,
      transactionTypes: mockTransactionTypes,
    });
  });

  it('should render with "Add Budget" title when creating new budget', () => {
    render(
      <BudgetDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Add Budget')).toBeInTheDocument();
  });

  it('should render with "Edit Budget" title when editing existing budget', () => {
    const budget: Budget = {
      id: '1',
      transactionTypeId: 'tt1',
      amount: 500,
      period: 'monthly',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    render(
      <BudgetDialog
        open={true}
        budget={budget}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Edit Budget')).toBeInTheDocument();
  });

  it('should populate form with existing budget item data', () => {
    const budget: Budget = {
      id: '1',
      transactionTypeId: 'tt1',
      amount: 500,
      period: 'monthly',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    render(
      <BudgetDialog
        open={true}
        budget={budget}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByDisplayValue('500')).toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(
      <BudgetDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show validation error when transaction type is not selected', async () => {
    render(
      <BudgetDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByText('Add');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Transaction type is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error when amount is invalid', async () => {
    render(
      <BudgetDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const amountInput = screen.getByLabelText(/Amount/i);
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '0');

    const submitButton = screen.getByText('Add');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should disable transaction type field when editing', () => {
    const budget: Budget = {
      id: '1',
      transactionTypeId: 'tt1',
      amount: 500,
      period: 'monthly',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    render(
      <BudgetDialog
        open={true}
        budget={budget}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const transactionTypeField = screen.getByLabelText(/Transaction Type/i).closest('div');
    expect(transactionTypeField).toHaveAttribute('aria-disabled', 'true');
  });

  it('should render dialog when closed', () => {
    const { container } = render(
      <BudgetDialog
        open={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Dialog should not be visible when open=false
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });
});
