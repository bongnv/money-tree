import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountDialog } from './AccountDialog';
import { AccountType } from '../../types/enums';
import type { Account } from '../../types/models';

describe('AccountDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog when open', () => {
    render(
      <AccountDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Create New Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Name/i)).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(
      <AccountDialog
        open={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.queryByText('Create New Account')).not.toBeInTheDocument();
  });

  it('should show edit title when account is provided', () => {
    const account: Account = {
      id: 'acc-1',
      name: 'Test Account',
      type: AccountType.BANK_ACCOUNT,
      currencyId: 'usd',
      initialBalance: 1000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    render(
      <AccountDialog
        open={true}
        account={account}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Edit Account')).toBeInTheDocument();
  });

  it('should call onSubmit and onClose when form is submitted', async () => {
    const user = userEvent.setup();
    render(
      <AccountDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const nameInput = screen.getByLabelText(/Account Name/i);
    await user.type(nameInput, 'New Account');

    const submitButton = screen.getByText('Create Account');
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AccountDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
