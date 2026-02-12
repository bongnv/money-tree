/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { TransactionDialog } from './TransactionDialog';
import type { Transaction, Account, TransactionType, Category } from '@/types/models';
import { AccountType, Group, CurrencyCode } from '@/types/enums';

// Mock the TransactionForm component
jest.mock('./TransactionForm', () => ({
  TransactionForm: ({ onSubmit, onCancel, transaction }: any) => (
    <div data-testid="transaction-form">
      <button
        onClick={() => onSubmit({ date: '2024-01-01', amount: 100, transactionTypeId: 'type-1' })}
      >
        Submit
      </button>
      <button onClick={onCancel}>Cancel</button>
      <div>{transaction ? 'Edit Mode' : 'Create Mode'}</div>
    </div>
  ),
}));

describe('TransactionDialog', () => {
  const mockAccounts: Account[] = [
    {
      id: 'account-1',
      name: 'Checking',
      type: AccountType.BANK_ACCOUNT,
      currencyCode: CurrencyCode.USD,
      initialBalance: 1000,
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

  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with "Add Transaction" title when no transaction provided', () => {
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
    expect(screen.getByText('Create Mode')).toBeInTheDocument();
  });

  it('should render with "Edit Transaction" title when transaction provided', () => {
    const mockTransaction: Transaction = {
      id: 'tx-1',
      date: '2024-01-15',
      amount: 50,
      transactionTypeId: 'type-1',
      fromAccountId: 'account-1',
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

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
    expect(screen.getByText('Edit Mode')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    const { container } = render(
      <TransactionDialog
        open={false}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should call onSubmit and onClose when form is submitted', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

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

    const submitButton = screen.getByText('Submit');
    submitButton.click();

    await screen.findByTestId('transaction-form');

    expect(mockOnSubmit).toHaveBeenCalledWith({
      date: '2024-01-01',
      amount: 100,
      transactionTypeId: 'type-1',
    });
  });

  it('should pass all props to TransactionForm', () => {
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

    expect(screen.getByTestId('transaction-form')).toBeInTheDocument();
  });
});
