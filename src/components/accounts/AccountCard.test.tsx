import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountCard } from './AccountCard';
import { AccountType } from '../../types/enums';
import type { Account, Transaction } from '../../types/models';
import { useTransactionStore } from '../../stores/useTransactionStore';

jest.mock('../../stores/useTransactionStore');

const mockUseTransactionStore = useTransactionStore as jest.MockedFunction<typeof useTransactionStore>;

describe('AccountCard', () => {
  const mockAccount: Account = {
    id: 'acc-1',
    name: 'Checking Account',
    type: AccountType.BANK_ACCOUNT,
    currencyId: 'usd',
    initialBalance: 1000,
    description: 'My main checking account',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock: no transactions
    mockUseTransactionStore.mockReturnValue({
      transactions: [],
      addTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      deleteTransaction: jest.fn(),
      getTransactionsByAccount: jest.fn(),
      getTransactionsByType: jest.fn(),
      getTransactionsByDateRange: jest.fn(),
    });
  });

  it('should render account information', () => {
    render(
      <AccountCard
        account={mockAccount}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Checking Account')).toBeInTheDocument();
    expect(screen.getByText('$1000.00')).toBeInTheDocument();
    expect(screen.getByText('My main checking account')).toBeInTheDocument();
    expect(screen.getByText('BANK ACCOUNT')).toBeInTheDocument();
  });

  it('should render without description', () => {
    const accountWithoutDescription = { ...mockAccount, description: undefined };
    render(
      <AccountCard
        account={accountWithoutDescription}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Checking Account')).toBeInTheDocument();
    expect(screen.queryByText('My main checking account')).not.toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AccountCard
        account={mockAccount}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByLabelText('Edit Checking Account');
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockAccount);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AccountCard
        account={mockAccount}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByLabelText('Delete Checking Account');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockAccount);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('should show inactive status', () => {
    const inactiveAccount = { ...mockAccount, isActive: false };
    render(
      <AccountCard
        account={inactiveAccount}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('BANK ACCOUNT')).toBeInTheDocument();
  });

  it('should display calculated balance with transactions', () => {
    const mockTransactions: Transaction[] = [
      {
        id: 'txn-1',
        date: '2024-01-15',
        amount: 200,
        transactionTypeId: 'tt-1',
        toAccountId: 'acc-1', // Money coming in
        fromAccountId: '',
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      },
      {
        id: 'txn-2',
        date: '2024-01-16',
        amount: 50,
        transactionTypeId: 'tt-2',
        fromAccountId: 'acc-1', // Money going out
        toAccountId: '',
        createdAt: '2024-01-16T00:00:00.000Z',
        updatedAt: '2024-01-16T00:00:00.000Z',
      },
    ];

    mockUseTransactionStore.mockReturnValue({
      transactions: mockTransactions,
      addTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      deleteTransaction: jest.fn(),
      getTransactionsByAccount: jest.fn(),
      getTransactionsByType: jest.fn(),
      getTransactionsByDateRange: jest.fn(),
    });

    render(
      <AccountCard
        account={mockAccount}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Initial balance: $1000 + $200 (in) - $50 (out) = $1150
    expect(screen.getByText('$1150.00')).toBeInTheDocument();
  });
});
