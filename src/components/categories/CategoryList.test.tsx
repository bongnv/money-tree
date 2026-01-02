import { render, screen } from '@testing-library/react';
import { CategoryList } from './CategoryList';
import { Group } from '../../types/enums';
import type { Category, TransactionType } from '../../types/models';

describe('CategoryList', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Groceries',
      group: Group.EXPENSE,
      description: 'Food and household items',
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
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'tt-2',
      name: 'Restaurant',
      categoryId: 'cat-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all categories', () => {
    render(
      <CategoryList
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('should show correct transaction type count for each category', () => {
    render(
      <CategoryList
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('2 transaction types')).toBeInTheDocument();
    expect(screen.getByText('0 transaction types')).toBeInTheDocument();
  });

  it('should show empty state when no categories', () => {
    render(
      <CategoryList
        categories={[]}
        transactionTypes={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/no categories yet/i)).toBeInTheDocument();
  });
});
