import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryCard } from './CategoryCard';
import { Group } from '../../types/enums';
import type { Category } from '../../types/models';

describe('CategoryCard', () => {
  const mockCategory: Category = {
    id: 'cat-1',
    name: 'Groceries',
    group: Group.EXPENSE,
    description: 'Food and household items',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render category information', () => {
    render(
      <CategoryCard
        category={mockCategory}
        transactionTypeCount={3}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Food and household items')).toBeInTheDocument();
    expect(screen.getByText('EXPENSE')).toBeInTheDocument();
    expect(screen.getByText('3 transaction types')).toBeInTheDocument();
  });

  it('should render without description', () => {
    const categoryWithoutDescription = { ...mockCategory, description: undefined };
    render(
      <CategoryCard
        category={categoryWithoutDescription}
        transactionTypeCount={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText('Food and household items')).not.toBeInTheDocument();
  });

  it('should display singular "type" for count of 1', () => {
    render(
      <CategoryCard
        category={mockCategory}
        transactionTypeCount={1}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('1 transaction type')).toBeInTheDocument();
  });

  it('should display plural "types" for count other than 1', () => {
    render(
      <CategoryCard
        category={mockCategory}
        transactionTypeCount={5}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('5 transaction types')).toBeInTheDocument();
  });

  it('should show correct color for income group', () => {
    const incomeCategory = { ...mockCategory, group: Group.INCOME };
    render(
      <CategoryCard
        category={incomeCategory}
        transactionTypeCount={2}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('INCOME')).toBeInTheDocument();
  });

  it('should show correct color for transfer group', () => {
    const transferCategory = { ...mockCategory, group: Group.TRANSFER };
    render(
      <CategoryCard
        category={transferCategory}
        transactionTypeCount={2}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('TRANSFER')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCard
        category={mockCategory}
        transactionTypeCount={3}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByLabelText('Edit Groceries');
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCategory);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCard
        category={mockCategory}
        transactionTypeCount={3}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByLabelText('Delete Groceries');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockCategory);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });
});
