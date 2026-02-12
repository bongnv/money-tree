import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Group } from '@/types/enums';
import type { TransactionType, Category } from '@/types/models';
import { TransactionTypeCard } from './TransactionTypeCard';

describe('TransactionTypeCard', () => {
  const mockCategory: Category = {
    id: 'cat-1',
    name: 'Groceries',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    isDeleted: false,
  };

  const mockTransactionType: TransactionType = {
    id: 'tt-1',
    name: 'Supermarket',
    categoryId: 'cat-1',
    group: Group.EXPENSE,
    description: 'Grocery shopping',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    isActive: false,
    isDeleted: false,
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnArchive = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render transaction type information', () => {
    render(
      <TransactionTypeCard
        transactionType={mockTransactionType}
        category={mockCategory}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onArchive={mockOnArchive}
      />
    );

    expect(screen.getByText('Supermarket')).toBeInTheDocument();
    expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
    expect(screen.getByText('EXPENSE')).toBeInTheDocument();
    expect(screen.getByText(/Category: Groceries/i)).toBeInTheDocument();
  });

  it('should render without description', () => {
    const transactionTypeWithoutDescription = { ...mockTransactionType, description: undefined };
    render(
      <TransactionTypeCard
        transactionType={transactionTypeWithoutDescription}
        category={mockCategory}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onArchive={mockOnArchive}
      />
    );

    expect(screen.getByText('Supermarket')).toBeInTheDocument();
    expect(screen.queryByText('Grocery shopping')).not.toBeInTheDocument();
  });

  it('should render without category', () => {
    render(
      <TransactionTypeCard
        transactionType={mockTransactionType}
        category={undefined}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onArchive={mockOnArchive}
      />
    );

    expect(screen.getByText('Supermarket')).toBeInTheDocument();
    expect(screen.getByText('EXPENSE')).toBeInTheDocument();
    expect(screen.queryByText(/Category:/i)).not.toBeInTheDocument();
  });

  it('should show correct group badge', () => {
    const incomeTransactionType = { ...mockTransactionType, group: Group.INCOME };
    render(
      <TransactionTypeCard
        transactionType={incomeTransactionType}
        category={mockCategory}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onArchive={mockOnArchive}
      />
    );

    expect(screen.getByText('INCOME')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TransactionTypeCard
        transactionType={mockTransactionType}
        category={mockCategory}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onArchive={mockOnArchive}
      />
    );

    const editButton = screen.getByLabelText('Edit Supermarket');
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTransactionType);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TransactionTypeCard
        transactionType={mockTransactionType}
        category={mockCategory}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onArchive={mockOnArchive}
      />
    );

    const deleteButton = screen.getByLabelText('Delete Supermarket');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockTransactionType);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });
});
