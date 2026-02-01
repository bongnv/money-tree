import React from 'react';
import { render, screen } from '@testing-library/react';
import { BudgetDialog } from './BudgetDialog';
import type { Budget, TransactionType, Category } from '../../types/models';
import { Group, CurrencyCode } from '../../types/enums';

// Mock all the complex hooks and components
jest.mock('../../hooks/useServices', () => ({
  useBudgetService: () => ({
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }),
}));

jest.mock('../../hooks/useApp', () => ({
  useApp: () => ({
    showSnackbar: jest.fn(),
  }),
}));

jest.mock('../../hooks/useSyncMetadata', () => ({
  useBaseCurrency: () => CurrencyCode.USD,
}));

describe('BudgetDialog', () => {
  const mockTransactionTypes: TransactionType[] = [
    {
      id: 'type-1',
      name: 'Groceries',
      categoryId: 'category-1',
      group: Group.EXPENSE,
      isActive: true,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'category-1',
      name: 'Food',
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with "Add Budget" title when no budget provided', () => {
    render(
      <BudgetDialog
        open={true}
        transactionTypes={mockTransactionTypes}
        categories={mockCategories}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Add Budget')).toBeInTheDocument();
  });

  it('should render with "Edit Budget" title when budget provided', () => {
    const mockBudget: Budget = {
      id: 'budget-1',
      transactionTypeId: 'type-1',
      amount: 500,
      currencyCode: CurrencyCode.USD,
      period: 'monthly',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    render(
      <BudgetDialog
        open={true}
        budget={mockBudget}
        transactionTypes={mockTransactionTypes}
        categories={mockCategories}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Edit Budget')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    const { container } = render(
      <BudgetDialog
        open={false}
        transactionTypes={mockTransactionTypes}
        categories={mockCategories}
        onClose={mockOnClose}
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });
});
