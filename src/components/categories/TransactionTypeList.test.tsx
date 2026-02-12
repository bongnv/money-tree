import { render, screen } from '@testing-library/react';
import { Group } from '@/types/enums';
import type { Category, TransactionType } from '@/types/models';
import { TransactionTypeList } from './TransactionTypeList';

describe('TransactionTypeList', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Groceries',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isDeleted: false,
    },
    {
      id: 'cat-2',
      name: 'Salary',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isDeleted: false,
    },
  ];

  const mockTransactionTypes: TransactionType[] = [
    {
      id: 'tt-1',
      name: 'Supermarket',
      categoryId: 'cat-1',
      group: Group.EXPENSE,
      description: 'Grocery shopping',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isActive: true,
      isDeleted: false,
    },
    {
      id: 'tt-2',
      name: 'Monthly Salary',
      categoryId: 'cat-2',
      group: Group.INCOME,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isActive: true,
      isDeleted: false,
    },
  ];

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnArchive = jest.fn();

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
        onArchive={mockOnArchive}
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
        onArchive={mockOnArchive}
      />
    );

    expect(screen.getByText(/Category: Groceries/i)).toBeInTheDocument();
    expect(screen.getByText(/Category: Salary/i)).toBeInTheDocument();
  });

  it('should show empty state when no transaction types', () => {
    render(
      <TransactionTypeList
        transactionTypes={[]}
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onArchive={mockOnArchive}
      />
    );

    expect(screen.getByText(/no transaction types yet/i)).toBeInTheDocument();
  });
});
