import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionTypeDialog } from './TransactionTypeDialog';
import { Group } from '../../types/enums';
import type { Category, TransactionType } from '../../types/models';

describe('TransactionTypeDialog', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Groceries',
      group: Group.EXPENSE,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog for new transaction type', () => {
    render(
      <TransactionTypeDialog
        open={true}
        categories={mockCategories}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Add Transaction Type')).toBeInTheDocument();
    expect(screen.getByLabelText(/transaction type name/i)).toBeInTheDocument();
  });

  it('should render dialog for editing transaction type', () => {
    const transactionType: TransactionType = {
      id: 'tt-1',
      name: 'Supermarket',
      categoryId: 'cat-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    render(
      <TransactionTypeDialog
        open={true}
        transactionType={transactionType}
        categories={mockCategories}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Edit Transaction Type')).toBeInTheDocument();
    expect(screen.getByLabelText(/transaction type name/i)).toHaveValue('Supermarket');
  });

  it('should not render when closed', () => {
    render(
      <TransactionTypeDialog
        open={false}
        categories={mockCategories}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.queryByText('Add Transaction Type')).not.toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TransactionTypeDialog
        open={true}
        categories={mockCategories}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onSubmit and onClose when form is submitted', async () => {
    const user = userEvent.setup();
    render(
      <TransactionTypeDialog
        open={true}
        categories={mockCategories}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    await user.type(screen.getByLabelText(/transaction type name/i), 'Test Type');
    await user.click(screen.getByLabelText(/category/i));
    await user.click(screen.getByRole('option', { name: /groceries/i }));

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
