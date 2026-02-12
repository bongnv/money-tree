/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionsPage } from './TransactionsPage';
import { useStore } from '@/contexts/StoreContext';

import { useTransactionDialog } from '@/hooks/transactions/useTransactionDialog';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import type { Transaction, Account, Category, TransactionType } from '@/types/models';
import { AccountType, Group, CurrencyCode } from '@/types/enums';

// Mock hooks
jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/ServiceContext');
jest.mock('@/hooks/transactions/useTransactionDialog');
jest.mock('@/hooks/transactions/useTransactionFilters');

// Mock components
jest.mock('./TransactionDialog', () => ({
  TransactionDialog: ({ open, onSubmit }: any) =>
    open ? (
      <div data-testid="transaction-dialog">
        <button onClick={() => onSubmit({ date: '2024-01-01', amount: 100 })}>Submit</button>
      </div>
    ) : null,
}));

jest.mock('./TransactionList', () => ({
  TransactionList: ({ transactions, onEdit, onDelete }: any) => (
    <div data-testid="transaction-list">
      {transactions.map((tx: Transaction) => (
        <div key={tx.id}>
          <span>{tx.id}</span>
          <button onClick={() => onEdit(tx)}>Edit {tx.id}</button>
          <button onClick={() => onDelete(tx)}>Delete {tx.id}</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('./TransactionFilters', () => ({
  TransactionFilters: ({ onFiltersChange }: any) => (
    <div data-testid="transaction-filters">
      <button onClick={() => onFiltersChange({ search: 'test' })}>Apply Filters</button>
    </div>
  ),
}));

jest.mock('./QuickEntryRow', () => ({
  QuickEntryRow: ({ onSubmit }: any) => (
    <div data-testid="quick-entry-row">
      <button onClick={() => onSubmit({ date: '2024-01-01', amount: 50 })}>Quick Add</button>
    </div>
  ),
}));

jest.mock('@/components/common/ConfirmDialog', () => ({
  ConfirmDialog: ({ open, onConfirm, onCancel }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseTransactionDialog = useTransactionDialog as jest.MockedFunction<
  typeof useTransactionDialog
>;
const mockUseTransactionFilters = useTransactionFilters as jest.MockedFunction<
  typeof useTransactionFilters
>;

describe('TransactionsPage', () => {
  const mockAccount: Account = {
    id: 'account-1',
    name: 'Checking',
    type: AccountType.BANK_ACCOUNT,
    currencyCode: CurrencyCode.USD,
    initialBalance: 1000,
    isActive: true,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockCategory: Category = {
    id: 'category-1',
    name: 'Food',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockTransactionType: TransactionType = {
    id: 'type-1',
    name: 'Groceries',
    categoryId: 'category-1',
    group: Group.EXPENSE,
    isActive: true,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

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

  const mockTransactionDialog = {
    isOpen: false,
    selectedItem: null,
    openCreate: jest.fn(),
    openEdit: jest.fn(),
    close: jest.fn(),
  };

  const mockSetFilters = jest.fn();
  const mockDeleteTransaction = jest.fn();
  const mockAddTransaction = jest.fn();
  const mockUpdateTransaction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      transactions: [mockTransaction],
      categories: [mockCategory],
      transactionTypes: [mockTransactionType],
      assets: [],
      budgets: [],
      exchangeRates: [],
      deleteTransaction: mockDeleteTransaction,
      addTransaction: mockAddTransaction,
      updateTransaction: mockUpdateTransaction,
    } as any);
    mockUseTransactionDialog.mockReturnValue(mockTransactionDialog as any);
    mockUseTransactionFilters.mockReturnValue({
      filters: {
        dateFrom: '',
        dateTo: '',
        accountIds: [],
        categoryIds: [],
        transactionTypeId: '',
        searchText: '',
        group: '',
      },
      setFilters: mockSetFilters,
      filteredTransactions: [mockTransaction],
    });
  });

  it('should render page title', () => {
    render(<TransactionsPage />);
    expect(screen.getByText('Transactions')).toBeInTheDocument();
  });

  it('should render new transaction button', () => {
    render(<TransactionsPage />);
    expect(screen.getByTestId('new-transaction-button')).toBeInTheDocument();
  });

  it('should render transaction filters', () => {
    render(<TransactionsPage />);
    expect(screen.getByTestId('transaction-filters')).toBeInTheDocument();
  });

  it('should render quick entry row', () => {
    render(<TransactionsPage />);
    expect(screen.getByTestId('quick-entry-row')).toBeInTheDocument();
  });

  it('should render transaction list with transactions', () => {
    render(<TransactionsPage />);
    expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
    expect(screen.getByText('tx-1')).toBeInTheDocument();
  });

  it('should open create dialog when new transaction button is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);

    const newButton = screen.getByTestId('new-transaction-button');
    await user.click(newButton);

    expect(mockTransactionDialog.openCreate).toHaveBeenCalled();
  });

  it('should open edit dialog when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);

    const editButton = screen.getByText('Edit tx-1');
    await user.click(editButton);

    expect(mockTransactionDialog.openEdit).toHaveBeenCalledWith(mockTransaction);
  });

  it('should show delete confirmation when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);

    const deleteButton = screen.getByText('Delete tx-1');
    await user.click(deleteButton);

    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
  });

  it('should delete transaction when confirmed', async () => {
    const user = userEvent.setup();
    mockDeleteTransaction.mockResolvedValue(undefined);

    render(<TransactionsPage />);

    const deleteButton = screen.getByText('Delete tx-1');
    await user.click(deleteButton);

    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteTransaction).toHaveBeenCalledWith('tx-1');
    });
  });

  it('should cancel delete when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);

    const deleteButton = screen.getByText('Delete tx-1');
    await user.click(deleteButton);

    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });

  it('should create transaction when dialog is submitted in create mode', async () => {
    const user = userEvent.setup();
    mockAddTransaction.mockResolvedValue(undefined);
    mockUseTransactionDialog.mockReturnValue({
      ...mockTransactionDialog,
      isOpen: true,
      selectedItem: null,
    } as any);

    render(<TransactionsPage />);

    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddTransaction).toHaveBeenCalledWith({
        date: '2024-01-01',
        amount: 100,
      });
    });
  });

  it('should update transaction when dialog is submitted in edit mode', async () => {
    const user = userEvent.setup();
    mockUpdateTransaction.mockResolvedValue(undefined);
    mockUseTransactionDialog.mockReturnValue({
      ...mockTransactionDialog,
      isOpen: true,
      selectedItem: mockTransaction,
    } as any);

    render(<TransactionsPage />);

    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateTransaction).toHaveBeenCalledWith('tx-1', {
        date: '2024-01-01',
        amount: 100,
      });
    });
  });

  it('should create transaction from quick entry', async () => {
    const user = userEvent.setup();
    mockAddTransaction.mockResolvedValue(undefined);

    render(<TransactionsPage />);

    const quickAddButton = screen.getByText('Quick Add');
    await user.click(quickAddButton);

    await waitFor(() => {
      expect(mockAddTransaction).toHaveBeenCalledWith({
        date: '2024-01-01',
        amount: 50,
      });
    });
  });

  it('should update filters when filter changes', async () => {
    const user = userEvent.setup();
    mockUseTransactionFilters.mockReturnValue({
      filters: {
        dateFrom: '',
        dateTo: '',
        accountIds: [],
        categoryIds: [],
        transactionTypeId: '',
        searchText: '',
        group: '',
      },
      setFilters: mockSetFilters,
      filteredTransactions: [mockTransaction],
    });

    render(<TransactionsPage />);

    const applyFiltersButton = screen.getByText('Apply Filters');
    await user.click(applyFiltersButton);

    expect(mockSetFilters).toHaveBeenCalledWith({ search: 'test' });
  });

  it('should handle empty transactions list', () => {
    mockUseStore.mockReturnValue({
      transactions: [],
      accounts: [mockAccount],
      categories: [mockCategory],
      transactionTypes: [mockTransactionType],
      assets: [],
    } as any);
    mockUseTransactionFilters.mockReturnValue({
      filters: {
        dateFrom: '',
        dateTo: '',
        accountIds: [],
        categoryIds: [],
        transactionTypeId: '',
        searchText: '',
        group: '',
      },
      setFilters: mockSetFilters,
      filteredTransactions: [],
    });

    render(<TransactionsPage />);

    expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
  });

  it('should handle undefined data from hooks', () => {
    mockUseStore.mockReturnValue({
      transactions: undefined,
      accounts: undefined,
      categories: undefined,
      transactionTypes: undefined,
      assets: undefined,
    } as any);
    mockUseTransactionFilters.mockReturnValue({
      filters: {
        dateFrom: '',
        dateTo: '',
        accountIds: [],
        categoryIds: [],
        transactionTypeId: '',
        searchText: '',
        group: '',
      },
      setFilters: mockSetFilters,
      filteredTransactions: [],
    });

    render(<TransactionsPage />);

    expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
  });
});
