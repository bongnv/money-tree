import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionForm } from './TransactionForm';
import type { Transaction, Account, TransactionType, Category } from '../../types/models';
import { Group, AccountType } from '../../types/enums';

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
  {
    id: 'acc-3',
    name: 'Inactive Account',
    type: AccountType.BANK_ACCOUNT,
    currencyId: 'usd',
    initialBalance: 0,
    isActive: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Food',
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
  {
    id: 'cat-3',
    name: 'Account Transfer',
    group: Group.TRANSFER,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-4',
    name: 'Investments',
    group: Group.INVESTMENT,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const mockTransactionTypes: TransactionType[] = [
  {
    id: 'type-1',
    name: 'Groceries',
    categoryId: 'cat-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'type-2',
    name: 'Monthly Salary',
    categoryId: 'cat-2',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'type-3',
    name: 'Between Accounts',
    categoryId: 'cat-3',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'type-4',
    name: 'Stock Purchase',
    categoryId: 'cat-4',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const mockTransaction: Transaction = {
  id: 'txn-1',
  date: '2024-03-15T00:00:00.000Z',
  description: 'Test Transaction',
  amount: 100,
  transactionTypeId: 'type-1',
  fromAccountId: 'acc-1',
  createdAt: '2024-03-15T00:00:00.000Z',
  updatedAt: '2024-03-15T00:00:00.000Z',
};

describe('TransactionForm', () => {
  const defaultProps = {
    accounts: mockAccounts,
    categories: mockCategories,
    transactionTypes: mockTransactionTypes,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all required fields', () => {
    render(<TransactionForm {...defaultProps} />);

    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/transaction type/i)).toBeInTheDocument();
  });

  it('should render Cancel and Create buttons', () => {
    render(<TransactionForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('should render Update button when editing', () => {
    render(<TransactionForm {...defaultProps} transaction={mockTransaction} />);

    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  it('should populate form when editing transaction', () => {
    render(<TransactionForm {...defaultProps} transaction={mockTransaction} />);

    expect(screen.getByLabelText(/description/i)).toHaveValue('Test Transaction');
    expect(screen.getByLabelText(/amount/i)).toHaveValue(100);
  });

  it('should show validation errors on submit with empty fields', async () => {
    const user = userEvent.setup();
    render(<TransactionForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
    });
  });

  it('should call onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  describe('Expense transaction (fromAccount only)', () => {
    it('should show fromAccount field when expense type is selected', async () => {
      const user = userEvent.setup();
      render(<TransactionForm {...defaultProps} />);

      const typeSelect = screen.getByLabelText(/transaction type/i);
      await user.click(typeSelect);
      await user.click(screen.getByText('Groceries'));

      await waitFor(() => {
        expect(screen.getByLabelText(/from account/i)).toBeInTheDocument();
      });
      expect(screen.queryByLabelText(/to account/i)).not.toBeInTheDocument();
    });

    it('should submit expense transaction with valid data', async () => {
      const user = userEvent.setup();
      render(<TransactionForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/description/i), 'Groceries');
      await user.type(screen.getByLabelText(/amount/i), '50.00');

      const typeSelect = screen.getByLabelText(/transaction type/i);
      await user.click(typeSelect);
      await user.click(screen.getByText('Groceries'));

      await waitFor(() => {
        expect(screen.getByLabelText(/from account/i)).toBeInTheDocument();
      });

      const fromSelect = screen.getByLabelText(/from account/i);
      await user.click(fromSelect);
      await user.click(screen.getByText('Checking'));

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Groceries',
            amount: 50,
            transactionTypeId: 'type-1',
            fromAccountId: 'acc-1',
            toAccountId: undefined,
          })
        );
      });
    });
  });

  describe('Income transaction (toAccount only)', () => {
    it('should show toAccount field when income type is selected', async () => {
      const user = userEvent.setup();
      render(<TransactionForm {...defaultProps} />);

      const typeSelect = screen.getByLabelText(/transaction type/i);
      await user.click(typeSelect);
      await user.click(screen.getByText('Monthly Salary'));

      await waitFor(() => {
        expect(screen.getByLabelText(/to account/i)).toBeInTheDocument();
      });
      expect(screen.queryByLabelText(/from account/i)).not.toBeInTheDocument();
    });

    it('should submit income transaction with valid data', async () => {
      const user = userEvent.setup();
      render(<TransactionForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/description/i), 'Salary');
      await user.type(screen.getByLabelText(/amount/i), '3000');

      const typeSelect = screen.getByLabelText(/transaction type/i);
      await user.click(typeSelect);
      await user.click(screen.getByText('Monthly Salary'));

      await waitFor(() => {
        expect(screen.getByLabelText(/to account/i)).toBeInTheDocument();
      });

      const toSelect = screen.getByLabelText(/to account/i);
      await user.click(toSelect);
      await user.click(screen.getByText('Checking'));

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Salary',
            amount: 3000,
            transactionTypeId: 'type-2',
            fromAccountId: undefined,
            toAccountId: 'acc-1',
          })
        );
      });
    });
  });

  describe('Transfer transaction (both accounts)', () => {
    it('should show both account fields when transfer type is selected', async () => {
      const user = userEvent.setup();
      render(<TransactionForm {...defaultProps} />);

      const typeSelect = screen.getByLabelText(/transaction type/i);
      await user.click(typeSelect);
      await user.click(screen.getByText('Between Accounts'));

      await waitFor(() => {
        expect(screen.getByLabelText(/from account/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/to account/i)).toBeInTheDocument();
      });
    });

    it('should submit transfer transaction with valid data', async () => {
      const user = userEvent.setup();
      render(<TransactionForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/description/i), 'Transfer to Savings');
      await user.type(screen.getByLabelText(/amount/i), '500');

      const typeSelect = screen.getByLabelText(/transaction type/i);
      await user.click(typeSelect);
      await user.click(screen.getByText('Between Accounts'));

      await waitFor(() => {
        expect(screen.getByLabelText(/from account/i)).toBeInTheDocument();
      });

      const fromSelect = screen.getByLabelText(/from account/i);
      await user.click(fromSelect);
      await user.click(screen.getAllByText('Checking')[0]);

      const toSelect = screen.getByLabelText(/to account/i);
      await user.click(toSelect);
      await user.click(screen.getByText('Savings'));

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Transfer to Savings',
            amount: 500,
            transactionTypeId: 'type-3',
            fromAccountId: 'acc-1',
            toAccountId: 'acc-2',
          })
        );
      });
    });
  });

  describe('Investment transaction (toAccount only)', () => {
    it('should show toAccount field when investment type is selected', async () => {
      const user = userEvent.setup();
      render(<TransactionForm {...defaultProps} />);

      const typeSelect = screen.getByLabelText(/transaction type/i);
      await user.click(typeSelect);
      await user.click(screen.getByText('Stock Purchase'));

      await waitFor(() => {
        expect(screen.getByLabelText(/to account/i)).toBeInTheDocument();
      });
      expect(screen.queryByLabelText(/from account/i)).not.toBeInTheDocument();
    });
  });

  it('should only show active accounts in dropdowns', async () => {
    const user = userEvent.setup();
    render(<TransactionForm {...defaultProps} />);

    const typeSelect = screen.getByLabelText(/transaction type/i);
    await user.click(typeSelect);
    await user.click(screen.getByText('Groceries'));

    await waitFor(() => {
      expect(screen.getByLabelText(/from account/i)).toBeInTheDocument();
    });

    const fromSelect = screen.getByLabelText(/from account/i);
    await user.click(fromSelect);

    expect(screen.getByText('Checking')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.queryByText('Inactive Account')).not.toBeInTheDocument();
  });

  it('should group transaction types by category', async () => {
    const user = userEvent.setup();
    render(<TransactionForm {...defaultProps} />);

    const typeSelect = screen.getByLabelText(/transaction type/i);
    await user.click(typeSelect);

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Account Transfer')).toBeInTheDocument();
    expect(screen.getByText('Investments')).toBeInTheDocument();
  });

  it('should clear error when field is corrected', async () => {
    const user = userEvent.setup();
    render(<TransactionForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/amount/i), '100');

    await waitFor(() => {
      expect(screen.queryByText(/amount must be greater than 0/i)).not.toBeInTheDocument();
    });
  });
});
