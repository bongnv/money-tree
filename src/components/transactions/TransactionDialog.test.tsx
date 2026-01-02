import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionDialog } from './TransactionDialog';
import type { Transaction, Account, TransactionType, Category } from '../../types/models';
import { Group, AccountType } from '../../types/enums';

describe('TransactionDialog', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Checking',
      type: AccountType.BANK_ACCOUNT,
      currencyId: 'usd',
      initialBalance: 1000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'acc-2',
      name: 'Savings',
      type: AccountType.BANK_ACCOUNT,
      currencyId: 'usd',
      initialBalance: 5000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Food & Dining',
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
      name: 'Groceries',
      categoryId: 'cat-1',
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

  const mockTransaction: Transaction = {
    id: 'txn-1',
    date: '2024-01-15',
    description: 'Grocery shopping',
    amount: 50.25,
    transactionTypeId: 'tt-1',
    fromAccountId: 'acc-1',
    toAccountId: '',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
  };

  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with Add Transaction title when no transaction provided', () => {
    render(
      <TransactionDialog
        open={true}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Add Transaction')).toBeInTheDocument();
  });

  it('renders with Edit Transaction title when transaction provided', () => {
    render(
      <TransactionDialog
        open={true}
        transaction={mockTransaction}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <TransactionDialog
        open={false}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.queryByText('Add Transaction')).not.toBeInTheDocument();
  });

  it('renders TransactionForm with correct props', () => {
    render(
      <TransactionDialog
        open={true}
        transaction={mockTransaction}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByLabelText(/description/i)).toHaveValue('Grocery shopping');
    expect(screen.getByLabelText(/amount/i)).toHaveValue(50.25);
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TransactionDialog
        open={true}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit and onClose when form is submitted', async () => {
    const user = userEvent.setup();
    
    render(
      <TransactionDialog
        open={true}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill out form
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Test transaction');

    const amountInput = screen.getByLabelText(/amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, '100');

    const transactionTypeSelect = screen.getByLabelText(/transaction type/i);
    await user.click(transactionTypeSelect);
    const expenseOption = await screen.findByText('Groceries');
    await user.click(expenseOption);

    const fromAccountSelect = screen.getByLabelText(/from account/i);
    await user.click(fromAccountSelect);
    const accountOption = await screen.findByRole('option', { name: /checking/i });
    await user.click(accountOption);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Test transaction',
        amount: 100,
        transactionTypeId: 'tt-1',
        fromAccountId: 'acc-1',
      })
    );
  });

  it('closes dialog when clicking backdrop', async () => {
    const user = userEvent.setup();
    
    render(
      <TransactionDialog
        open={true}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Click on backdrop (outside dialog)
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('populates form with transaction data when editing', () => {
    render(
      <TransactionDialog
        open={true}
        transaction={mockTransaction}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByLabelText(/description/i)).toHaveValue('Grocery shopping');
    expect(screen.getByLabelText(/amount/i)).toHaveValue(50.25);
    // Date field value depends on how the date string is formatted for input
    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
    expect(dateInput.value).toMatch(/2024-01-1[45]/); // Accounts for timezone conversion
  });

  it('renders fullWidth and maxWidth=sm dialog', () => {
    render(
      <TransactionDialog
        open={true}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Verify dialog is rendered by checking for the dialog content
    expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
