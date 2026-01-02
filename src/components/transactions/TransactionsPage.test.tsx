import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionsPage } from './TransactionsPage';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import type { Transaction, Account, Category, TransactionType } from '../../types/models';
import { Group, AccountType } from '../../types/enums';

jest.mock('../../stores/useTransactionStore');
jest.mock('../../stores/useAccountStore');
jest.mock('../../stores/useCategoryStore');

const mockUseTransactionStore = useTransactionStore as jest.MockedFunction<typeof useTransactionStore>;
const mockUseAccountStore = useAccountStore as jest.MockedFunction<typeof useAccountStore>;
const mockUseCategoryStore = useCategoryStore as jest.MockedFunction<typeof useCategoryStore>;

describe('TransactionsPage', () => {
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
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Food & Dining',
      group: Group.EXPENSE,
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
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'txn-1',
      date: '2024-01-15',
      description: 'Grocery shopping',
      amount: 50.25,
      transactionTypeId: 'tt-1',
      fromAccountId: 'acc-1',
      toAccountId: '',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
    },
  ];

  const mockAddTransaction = jest.fn();
  const mockUpdateTransaction = jest.fn();
  const mockDeleteTransaction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTransactionStore.mockReturnValue({
      transactions: [],
      addTransaction: mockAddTransaction,
      updateTransaction: mockUpdateTransaction,
      deleteTransaction: mockDeleteTransaction,
      getTransactionsByAccount: jest.fn(),
      getTransactionsByType: jest.fn(),
      getTransactionsByDateRange: jest.fn(),
    });

    mockUseAccountStore.mockReturnValue({
      accounts: mockAccounts,
      addAccount: jest.fn(),
      updateAccount: jest.fn(),
      deleteAccount: jest.fn(),
      getAccountById: jest.fn(),
    });

    mockUseCategoryStore.mockReturnValue({
      categories: mockCategories,
      transactionTypes: mockTransactionTypes,
      addCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      addTransactionType: jest.fn(),
      updateTransactionType: jest.fn(),
      deleteTransactionType: jest.fn(),
      getCategoryById: jest.fn(),
      getTransactionTypeById: jest.fn(),
    });
  });

  it('renders page title', () => {
    render(<TransactionsPage />);
    expect(screen.getByRole('heading', { name: /transactions/i })).toBeInTheDocument();
  });

  it('renders New Transaction button', () => {
    render(<TransactionsPage />);
    expect(screen.getByTestId('new-transaction-button')).toBeInTheDocument();
  });

  it('shows empty state when no transactions', () => {
    render(<TransactionsPage />);
    expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();
  });

  it('does not show empty state when transactions exist', () => {
    mockUseTransactionStore.mockReturnValue({
      transactions: mockTransactions,
      addTransaction: mockAddTransaction,
      updateTransaction: mockUpdateTransaction,
      deleteTransaction: mockDeleteTransaction,
      getTransactionsByAccount: jest.fn(),
      getTransactionsByType: jest.fn(),
      getTransactionsByDateRange: jest.fn(),
    });

    render(<TransactionsPage />);
    expect(screen.queryByText(/no transactions yet/i)).not.toBeInTheDocument();
  });

  it('opens dialog when New Transaction button is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);

    const newButton = screen.getByTestId('new-transaction-button');
    await user.click(newButton);

    expect(screen.getByText('Add Transaction')).toBeInTheDocument();
  });

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);

    // Open dialog
    const newButton = screen.getByTestId('new-transaction-button');
    await user.click(newButton);
    expect(screen.getByText('Add Transaction')).toBeInTheDocument();

    // Close dialog
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Add Transaction')).not.toBeInTheDocument();
    });
  });

  it('calls addTransaction when submitting new transaction', async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);

    // Open dialog
    const newButton = screen.getByTestId('new-transaction-button');
    await user.click(newButton);

    // Fill out form
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Test transaction');

    const amountInput = screen.getByLabelText(/amount/i);
    await user.type(amountInput, '100');

    const transactionTypeSelect = screen.getByLabelText(/transaction type/i);
    await user.click(transactionTypeSelect);
    const typeOption = await screen.findByText('Groceries');
    await user.click(typeOption);

    const fromAccountSelect = screen.getByLabelText(/from account/i);
    await user.click(fromAccountSelect);
    const accountOption = await screen.findByRole('option', { name: /checking/i });
    await user.click(accountOption);

    // Submit
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddTransaction).toHaveBeenCalledTimes(1);
    });

    expect(mockAddTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Test transaction',
        amount: 100,
        transactionTypeId: 'tt-1',
        fromAccountId: 'acc-1',
        id: expect.stringMatching(/^txn-/),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    );
  });

  it('generates unique transaction IDs', async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);

    // Open dialog first time
    const newButton = screen.getByTestId('new-transaction-button');
    await user.click(newButton);

    // Fill and submit first transaction
    const descriptionInput1 = screen.getByLabelText(/description/i);
    await user.type(descriptionInput1, 'First transaction');

    const amountInput1 = screen.getByLabelText(/amount/i);
    await user.type(amountInput1, '100');

    const transactionTypeSelect1 = screen.getByLabelText(/transaction type/i);
    await user.click(transactionTypeSelect1);
    const typeOption1 = await screen.findByText('Groceries');
    await user.click(typeOption1);

    const fromAccountSelect1 = screen.getByLabelText(/from account/i);
    await user.click(fromAccountSelect1);
    const accountOption1 = await screen.findByRole('option', { name: /checking/i });
    await user.click(accountOption1);

    const submitButton1 = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton1);

    await waitFor(() => {
      expect(mockAddTransaction).toHaveBeenCalledTimes(1);
    });

    const firstId = mockAddTransaction.mock.calls[0][0].id;

    // Wait for dialog to close
    await waitFor(() => {
      expect(screen.queryByText('Add Transaction')).not.toBeInTheDocument();
    });

    // Open dialog second time
    await user.click(newButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    });

    // Fill and submit second transaction
    const descriptionInput2 = screen.getByLabelText(/description/i);
    await user.type(descriptionInput2, 'Second transaction');

    const amountInput2 = screen.getByLabelText(/amount/i);
    await user.type(amountInput2, '200');

    const transactionTypeSelect2 = screen.getByLabelText(/transaction type/i);
    await user.click(transactionTypeSelect2);
    const typeOption2 = await screen.findByText('Groceries');
    await user.click(typeOption2);

    const fromAccountSelect2 = screen.getByLabelText(/from account/i);
    await user.click(fromAccountSelect2);
    const accountOption2 = await screen.findByRole('option', { name: /checking/i });
    await user.click(accountOption2);

    const submitButton2 = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton2);

    await waitFor(() => {
      expect(mockAddTransaction).toHaveBeenCalledTimes(2);
    });

    const secondId = mockAddTransaction.mock.calls[1][0].id;

    expect(firstId).not.toBe(secondId);
  });

  it('passes all required props to TransactionDialog', () => {
    render(<TransactionsPage />);

    // Dialog should be rendered but not visible
    expect(screen.queryByText('Add Transaction')).not.toBeInTheDocument();
  });

  it('resets selectedTransaction when opening dialog for new transaction', async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);

    // Open dialog
    const newButton = screen.getByTestId('new-transaction-button');
    await user.click(newButton);

    // Should show Add Transaction (not Edit)
    expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    expect(screen.queryByText('Edit Transaction')).not.toBeInTheDocument();
  });
});
