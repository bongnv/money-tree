import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountsPage } from './AccountsPage';
import { useAccountStore } from '../../stores/useAccountStore';
import { AccountType } from '../../types/enums';
import type { Account } from '../../types/models';

jest.mock('../../stores/useAccountStore');

describe('AccountsPage', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Checking Account',
      type: AccountType.BANK_ACCOUNT,
      currencyId: 'usd',
      initialBalance: 1000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockAddAccount = jest.fn();
  const mockUpdateAccount = jest.fn();
  const mockDeleteAccount = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAccountStore as unknown as jest.Mock).mockReturnValue({
      accounts: mockAccounts,
      addAccount: mockAddAccount,
      updateAccount: mockUpdateAccount,
      deleteAccount: mockDeleteAccount,
    });
  });

  it('should render accounts page with title', () => {
    render(<AccountsPage />);

    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('New Account')).toBeInTheDocument();
  });

  it('should render account list', () => {
    render(<AccountsPage />);

    expect(screen.getByText('Checking Account')).toBeInTheDocument();
  });

  it('should open dialog when New Account button is clicked', async () => {
    const user = userEvent.setup();
    render(<AccountsPage />);

    const newButton = screen.getByText('New Account');
    await user.click(newButton);

    expect(screen.getByText('Create New Account')).toBeInTheDocument();
  });

  it('should close dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<AccountsPage />);

    const newButton = screen.getByText('New Account');
    await user.click(newButton);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Create New Account')).not.toBeInTheDocument();
    });
  });

  it('should add new account when form is submitted', async () => {
    const user = userEvent.setup();
    render(<AccountsPage />);

    const newButton = screen.getByText('New Account');
    await user.click(newButton);

    const nameInput = screen.getByLabelText(/Account Name/i);
    await user.type(nameInput, 'New Account');

    const submitButton = screen.getByText('Create Account');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddAccount).toHaveBeenCalled();
      const addedAccount = mockAddAccount.mock.calls[0][0];
      expect(addedAccount.name).toBe('New Account');
      expect(addedAccount.id).toMatch(/^acc-/);
    });
  });

  it('should open edit dialog when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<AccountsPage />);

    const editButton = screen.getByLabelText('Edit Checking Account');
    await user.click(editButton);

    expect(screen.getByText('Edit Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Name/i)).toHaveValue('Checking Account');
  });

  it('should update account when edit form is submitted', async () => {
    const user = userEvent.setup();
    render(<AccountsPage />);

    const editButton = screen.getByLabelText('Edit Checking Account');
    await user.click(editButton);

    const nameInput = screen.getByLabelText(/Account Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Account');

    const submitButton = screen.getByText('Update Account');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateAccount).toHaveBeenCalledWith(
        'acc-1',
        expect.objectContaining({
          name: 'Updated Account',
        })
      );
    });
  });

  it('should open delete confirmation dialog when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<AccountsPage />);

    const deleteButton = screen.getByLabelText('Delete Checking Account');
    await user.click(deleteButton);

    expect(screen.getByText('Delete Account')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete "Checking Account"/i)
    ).toBeInTheDocument();
  });

  it('should delete account when confirmed', async () => {
    const user = userEvent.setup();
    render(<AccountsPage />);

    const deleteButton = screen.getByLabelText('Delete Checking Account');
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledWith('acc-1');
    });
  });

  it('should not delete account when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<AccountsPage />);

    const deleteButton = screen.getByLabelText('Delete Checking Account');
    await user.click(deleteButton);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(mockDeleteAccount).not.toHaveBeenCalled();
    });
  });

  it('should render empty state when no accounts', () => {
    (useAccountStore as unknown as jest.Mock).mockReturnValue({
      accounts: [],
      addAccount: mockAddAccount,
      updateAccount: mockUpdateAccount,
      deleteAccount: mockDeleteAccount,
    });

    render(<AccountsPage />);

    expect(
      screen.getByText(/No accounts yet. Create your first account to get started./i)
    ).toBeInTheDocument();
  });
});
