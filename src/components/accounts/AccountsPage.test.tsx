/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountsPage } from './AccountsPage';
import { useStore } from '@/contexts/StoreContext';
import { useAccountDialog } from '@/hooks/accounts/useAccountDialog';
import type { Account } from '@/types/models';
import { AccountType, CurrencyCode } from '@/types/enums';

jest.mock('@/contexts/StoreContext');
jest.mock('@/hooks/accounts/useAccountDialog');

jest.mock('./AccountList', () => ({
  AccountList: ({ accounts, onEdit, onDelete }: any) => (
    <div data-testid="account-list">
      {accounts?.map((acc: Account) => (
        <div key={acc.id}>
          <span>{acc.name}</span>
          <button onClick={() => onEdit(acc)}>Edit</button>
          <button onClick={() => onDelete(acc)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('./AccountDialog', () => ({
  AccountDialog: ({ open, onSubmit }: any) =>
    open ? (
      <div data-testid="account-dialog">
        <button onClick={() => onSubmit({ name: 'New Account', type: AccountType.BANK_ACCOUNT })}>
          Submit
        </button>
      </div>
    ) : null,
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
const mockUseAccountDialog = useAccountDialog as jest.MockedFunction<typeof useAccountDialog>;

describe('AccountsPage', () => {
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

  const mockAccountDialog = {
    isOpen: false,
    selectedItem: null,
    openCreate: jest.fn(),
    openEdit: jest.fn(),
    close: jest.fn(),
  };

  const mockDeleteAccount = jest.fn();
  const mockAddAccount = jest.fn();
  const mockUpdateAccount = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      transactions: [],
      budgets: [],
      categories: [],
      transactionTypes: [],
      assets: [],
      exchangeRates: [],
      deleteAccount: mockDeleteAccount,
      addAccount: mockAddAccount,
      updateAccount: mockUpdateAccount,
    } as any);
    mockUseAccountDialog.mockReturnValue(mockAccountDialog as any);
  });

  it('should render page title', () => {
    render(<AccountsPage />);
    expect(screen.getByText('Accounts')).toBeInTheDocument();
  });

  it('should render new account button', () => {
    render(<AccountsPage />);
    expect(screen.getByText('New Account')).toBeInTheDocument();
  });

  it('should render account list', () => {
    render(<AccountsPage />);
    expect(screen.getByTestId('account-list')).toBeInTheDocument();
    expect(screen.getByText('Checking')).toBeInTheDocument();
  });

  it('should open create dialog when new account button is clicked', async () => {
    const user = userEvent.setup();
    render(<AccountsPage />);

    const newButton = screen.getByText('New Account');
    await user.click(newButton);

    expect(mockAccountDialog.openCreate).toHaveBeenCalled();
  });

  it('should open edit dialog when edit is clicked', async () => {
    const user = userEvent.setup();
    render(<AccountsPage />);

    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    expect(mockAccountDialog.openEdit).toHaveBeenCalledWith(mockAccount);
  });

  it('should show delete confirmation when delete is clicked', async () => {
    const user = userEvent.setup();
    render(<AccountsPage />);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
  });

  it('should delete account when confirmed', async () => {
    const user = userEvent.setup();
    mockDeleteAccount.mockResolvedValue(undefined);

    render(<AccountsPage />);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledWith('account-1');
    });
  });

  it('should cancel delete when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<AccountsPage />);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });

  it('should create account when dialog is submitted in create mode', async () => {
    const user = userEvent.setup();
    mockAddAccount.mockResolvedValue(undefined);
    mockUseAccountDialog.mockReturnValue({
      ...mockAccountDialog,
      isOpen: true,
      selectedItem: null,
    } as any);

    render(<AccountsPage />);

    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddAccount).toHaveBeenCalledWith({
        name: 'New Account',
        type: AccountType.BANK_ACCOUNT,
      });
    });
  });

  it('should update account when dialog is submitted in edit mode', async () => {
    const user = userEvent.setup();
    mockUpdateAccount.mockResolvedValue(undefined);
    mockUseAccountDialog.mockReturnValue({
      ...mockAccountDialog,
      isOpen: true,
      selectedItem: mockAccount,
    } as any);

    render(<AccountsPage />);

    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateAccount).toHaveBeenCalledWith('account-1', {
        name: 'New Account',
        type: AccountType.BANK_ACCOUNT,
      });
    });
  });

  it('should handle empty accounts list', () => {
    mockUseStore.mockReturnValue({
      accounts: [],
      transactions: [],
      budgets: [],
      categories: [],
      transactionTypes: [],
      assets: [],
      exchangeRates: [],
    } as any);
    render(<AccountsPage />);
    expect(screen.getByTestId('account-list')).toBeInTheDocument();
  });

  it('should handle undefined accounts', () => {
    mockUseStore.mockReturnValue({
      accounts: undefined,
      transactions: [],
      budgets: [],
      categories: [],
      transactionTypes: [],
      assets: [],
      exchangeRates: [],
    } as any);
    render(<AccountsPage />);
    expect(screen.getByTestId('account-list')).toBeInTheDocument();
  });
});
