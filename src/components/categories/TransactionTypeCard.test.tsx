import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionTypeCard } from './TransactionTypeCard';
import { Group } from '../../types/enums';
import type { TransactionType, Category } from '../../types/models';

describe('TransactionTypeCard', () => {
  const mockCategory: Category = {
    id: 'cat-1',
    name: 'Groceries',
    group: Group.EXPENSE,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockTransactionType: TransactionType = {
    id: 'tt-1',
    name: 'Supermarket',
    categoryId: 'cat-1',
    description: 'Grocery shopping',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

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
      />
    );

    expect(screen.getByText('Supermarket')).toBeInTheDocument();
    expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('should render without description', () => {
    const transactionTypeWithoutDescription = { ...mockTransactionType, description: undefined };
    render(
      <TransactionTypeCard
        transactionType={transactionTypeWithoutDescription}
        category={mockCategory}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
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
      />
    );

    expect(screen.getByText('Supermarket')).toBeInTheDocument();
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
  });

  it('should show correct color for income category', () => {
    const incomeCategory = { ...mockCategory, group: Group.INCOME };
    render(
      <TransactionTypeCard
        transactionType={mockTransactionType}
        category={incomeCategory}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TransactionTypeCard
        transactionType={mockTransactionType}
        category={mockCategory}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
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
      />
    );

    const deleteButton = screen.getByLabelText('Delete Supermarket');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockTransactionType);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });
});
