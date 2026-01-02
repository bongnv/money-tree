import { render, screen } from '@testing-library/react';
import { TransactionTypeList } from './TransactionTypeList';
import { Group } from '../../types/enums';
import type { Category, TransactionType } from '../../types/models';

describe('TransactionTypeList', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Groceries',
      group: Group.EXPENSE,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'cat-2',
      name: 'Salary',
      group: Group.INCOME,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockTransactionTypes: TransactionType[] = [
    {
      id: 'tt-1',
      name: 'Supermarket',
      categoryId: 'cat-1',
      description: 'Grocery shopping',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'tt-2',
      name: 'Monthly Salary',
      categoryId: 'cat-2',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all transaction types', () => {
    render(
      <TransactionTypeList
        transactionTypes={mockTransactionTypes}
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Supermarket')).toBeInTheDocument();
    expect(screen.getByText('Monthly Salary')).toBeInTheDocument();
  });

  it('should show category names with each transaction type', () => {
    render(
      <TransactionTypeList
        transactionTypes={mockTransactionTypes}
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('should show empty state when no transaction types', () => {
    render(
      <TransactionTypeList
        transactionTypes={[]}
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/no transaction types yet/i)).toBeInTheDocument();
  });
});
