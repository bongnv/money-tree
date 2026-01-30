import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountDialog } from './AccountDialog';
import { AccountType, CurrencyCode } from '../../types/enums';
import type { Account } from '../../types/models';
import { useAccountForm } from '@/hooks/accounts/useAccountForm';

jest.mock('@/hooks/accounts/useAccountForm');

describe('AccountDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockSetField = jest.fn();
  const mockHandleSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for useAccountForm
    (useAccountForm as jest.Mock).mockReturnValue({
      formData: {
        name: '',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '0',
        description: '',
        isActive: true,
      },
      errors: {},
      isSubmitting: false,
      setField: mockSetField,
      handleSubmit: mockHandleSubmit,
    });
  });

  it('should render dialog when open', () => {
    render(<AccountDialog open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Create New Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Name/i)).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(<AccountDialog open={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    expect(screen.queryByText('Create New Account')).not.toBeInTheDocument();
  });

  it('should show edit title when account is provided', () => {
    const account: Account = {
      id: 'acc-1',
      name: 'Test Account',
      type: AccountType.BANK_ACCOUNT,
      currencyCode: CurrencyCode.USD,
      initialBalance: 1000,
      isActive: true,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    render(
      <AccountDialog open={true} account={account} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    expect(screen.getByText('Edit Account')).toBeInTheDocument();
  });

  it('should call onSubmit and onClose when form is submitted', async () => {
    const user = userEvent.setup();
    render(<AccountDialog open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/Account Name/i);
    await user.type(nameInput, 'New Account');

    // Verify setField was called (user.type calls setField for each character)
    expect(mockSetField).toHaveBeenCalled();
    // Check the last call was for the last character
    expect(mockSetField).toHaveBeenLastCalledWith('name', 't');

    const submitButton = screen.getByText('Create Account');
    await user.click(submitButton);

    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<AccountDialog open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
