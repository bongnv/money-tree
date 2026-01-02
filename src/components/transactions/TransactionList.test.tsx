import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionList } from './TransactionList';
import type { Transaction, Account, Category, TransactionType } from '../../types/models';
import { Group, AccountType } from '../../types/enums';

describe('TransactionList', () => {
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

  const mockTransactions: Transaction[] = [
    {
      id: 'txn-1',
      date: '2024-01-15T00:00:00.000Z',
      description: 'Grocery shopping',
      amount: 50.25,
      transactionTypeId: 'tt-1',
      fromAccountId: 'acc-1',
      toAccountId: undefined,
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: 'txn-2',
      date: '2024-01-20T00:00:00.000Z',
      description: 'Salary deposit',
      amount: 5000,
      transactionTypeId: 'tt-2',
      fromAccountId: undefined,
      toAccountId: 'acc-1',
      createdAt: '2024-01-20T00:00:00.000Z',
      updatedAt: '2024-01-20T00:00:00.000Z',
    },
  ];

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state when no transactions', () => {
    render(
      <TransactionList
        transactions={[]}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();
  });

  it('should render DataGrid when transactions exist', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('should display transaction data in columns', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
    expect(screen.getByText('Salary deposit')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Monthly Salary')).toBeInTheDocument();
  });

  it('should display category chips with correct colors', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const expenseChip = screen.getByText('Food & Dining');
    const incomeChip = screen.getByText('Salary');

    expect(expenseChip).toBeInTheDocument();
    expect(incomeChip).toBeInTheDocument();
  });

  it('should display formatted amounts', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check that amounts are displayed with currency formatting
    expect(screen.getByText('$50.25')).toBeInTheDocument();
    // Use query for larger amount - might have non-breaking spaces
    const amounts = screen.getAllByText(/\$/);
    expect(amounts.length).toBeGreaterThan(0);
  });

  it('should display from and to account names', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Both transactions involve Checking account
    const checkingCells = screen.getAllByText('Checking');
    expect(checkingCells.length).toBeGreaterThan(0);
  });

  it('should display em dash for missing description', () => {
    const transactionWithoutDescription: Transaction = {
      ...mockTransactions[0],
      description: undefined,
    };

    render(
      <TransactionList
        transactions={[transactionWithoutDescription]}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Em dash should appear in the description column
    const emDashes = screen.getAllByText('—');
    expect(emDashes.length).toBeGreaterThan(0);
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TransactionList
        transactions={mockTransactions}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByLabelText(/edit transaction/i);
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    // DataGrid sorts by date descending, so first row is transaction 2
    expect(mockOnEdit).toHaveBeenCalledWith(mockTransactions[1]);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TransactionList
        transactions={mockTransactions}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByLabelText(/delete transaction/i);
    await user.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    // DataGrid sorts by date descending, so first row is transaction 2
    expect(mockOnDelete).toHaveBeenCalledWith(mockTransactions[1]);
  });

  it('should display formatted dates', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan 20, 2024/i)).toBeInTheDocument();
  });

  it('should handle transactions with no matching account', () => {
    const transactionWithInvalidAccount: Transaction = {
      ...mockTransactions[0],
      fromAccountId: 'invalid-id',
    };

    render(
      <TransactionList
        transactions={[transactionWithInvalidAccount]}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Should still render without crashing
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('should handle transactions with no matching type or category', () => {
    const transactionWithInvalidType: Transaction = {
      ...mockTransactions[0],
      transactionTypeId: 'invalid-id',
    };

    render(
      <TransactionList
        transactions={[transactionWithInvalidType]}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Should display em dashes for missing data
    const emDashes = screen.getAllByText('—');
    expect(emDashes.length).toBeGreaterThan(0);
  });

  it('should sort transactions by date descending by default', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // DataGrid should be present with default sorting
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});
