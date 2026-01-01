import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountForm } from './AccountForm';
import { AccountType } from '../../types/enums';
import type { Account } from '../../types/models';

describe('AccountForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty form for new account', () => {
    render(<AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/Account Name/i)).toHaveValue('');
    expect(screen.getByLabelText(/Account Type/i)).toHaveTextContent('BANK ACCOUNT');
    expect(screen.getByLabelText(/Currency/i)).toHaveTextContent('USD - US Dollar');
    expect(screen.getByLabelText(/Initial Balance/i)).toHaveValue(0);
    expect(screen.getByLabelText(/Active/i)).toBeChecked();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('should render form with existing account data', () => {
    const account: Account = {
      id: 'acc-1',
      name: 'Test Account',
      type: AccountType.CASH,
      currencyId: 'eur',
      initialBalance: 1500,
      description: 'Test description',
      isActive: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    render(
      <AccountForm account={account} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(screen.getByLabelText(/Account Name/i)).toHaveValue('Test Account');
    expect(screen.getByLabelText(/Initial Balance/i)).toHaveValue(1500);
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Test description');
    expect(screen.getByLabelText(/Active/i)).not.toBeChecked();
    expect(screen.getByText('Update Account')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/Account Name/i);
    await user.clear(nameInput);

    const submitButton = screen.getByText('Create Account');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Account name is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate initial balance is a number', async () => {
    const user = userEvent.setup();
    render(<AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const balanceInput = screen.getByLabelText(/Initial Balance/i);
    await user.clear(balanceInput);
    await user.type(balanceInput, 'invalid');

    const submitButton = screen.getByText('Create Account');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Initial balance must be a valid number')
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit valid form data', async () => {
    const user = userEvent.setup();
    render(<AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/Account Name/i);
    await user.type(nameInput, 'New Account');

    const balanceInput = screen.getByLabelText(/Initial Balance/i);
    await user.clear(balanceInput);
    await user.type(balanceInput, '2500.50');

    const descriptionInput = screen.getByLabelText(/Description/i);
    await user.type(descriptionInput, 'My new account');

    const submitButton = screen.getByText('Create Account');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Account',
        type: AccountType.BANK_ACCOUNT,
        currencyId: 'usd',
        initialBalance: 2500.5,
        description: 'My new account',
        isActive: true,
      });
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should toggle active switch', async () => {
    const user = userEvent.setup();
    render(<AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const activeSwitch = screen.getByLabelText(/Active/i);
    expect(activeSwitch).toBeChecked();

    await user.click(activeSwitch);
    expect(activeSwitch).not.toBeChecked();

    await user.click(activeSwitch);
    expect(activeSwitch).toBeChecked();
  });

  it('should clear error when user starts typing', async () => {
    const user = userEvent.setup();
    render(<AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/Account Name/i);
    await user.clear(nameInput);

    const submitButton = screen.getByText('Create Account');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Account name is required')).toBeInTheDocument();
    });

    await user.type(nameInput, 'New Name');

    await waitFor(() => {
      expect(screen.queryByText('Account name is required')).not.toBeInTheDocument();
    });
  });
});
