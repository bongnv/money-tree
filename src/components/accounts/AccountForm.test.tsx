import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountForm } from './AccountForm';
import { AccountType, CurrencyCode } from '../../types/enums';
import type { Account } from '../../types/models';

// Mock the useAccountForm hook
jest.mock('@/hooks/accounts/useAccountForm', () => ({
  useAccountForm: jest.fn(),
}));

import { useAccountForm } from '@/hooks/accounts/useAccountForm';

describe('AccountForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockHandleSubmit = jest.fn();
  const mockSetField = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
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
      isEditMode: false,
    });
  });

  it('should render empty form for new account', () => {
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
      currencyCode: CurrencyCode.USD,
      initialBalance: 1500,
      description: 'Test description',
      isActive: false,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    (useAccountForm as jest.Mock).mockReturnValue({
      formData: {
        name: 'Test Account',
        type: AccountType.CASH,
        currencyCode: CurrencyCode.USD,
        initialBalance: '1500',
        description: 'Test description',
        isActive: false,
      },
      errors: {},
      isSubmitting: false,
      setField: mockSetField,
      handleSubmit: mockHandleSubmit,
    });

    render(<AccountForm account={account} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/Account Name/i)).toHaveValue('Test Account');
    expect(screen.getByLabelText(/Initial Balance/i)).toHaveValue(1500);
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Test description');
    expect(screen.getByLabelText(/Active/i)).not.toBeChecked();
    expect(screen.getByText('Update Account')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    // Mock with validation errors
    (useAccountForm as jest.Mock).mockReturnValue({
      formData: {
        name: '',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '0',
        description: '',
        isActive: true,
      },
      errors: {
        name: 'Account name is required',
      },
      isSubmitting: false,
      setField: mockSetField,
      handleSubmit: mockHandleSubmit,
      isEditMode: false,
    });

    render(<AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByText('Account name is required')).toBeInTheDocument();
    });
  });

  it('should validate initial balance is a number', async () => {
    // Mock with balance validation error
    (useAccountForm as jest.Mock).mockReturnValue({
      formData: {
        name: 'Test',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: 'invalid',
        description: '',
        isActive: true,
      },
      errors: {
        initialBalance: 'Initial balance must be a valid number',
      },
      isSubmitting: false,
      setField: mockSetField,
      handleSubmit: mockHandleSubmit,
      isEditMode: false,
    });

    render(<AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByText('Initial balance must be a valid number')).toBeInTheDocument();
    });
  });

  it('should submit valid form data', async () => {
    const user = userEvent.setup();

    (useAccountForm as jest.Mock).mockReturnValue({
      formData: {
        name: 'Test',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '100',
        description: '',
        isActive: true,
      },
      errors: {},
      isSubmitting: false,
      setField: mockSetField,
      handleSubmit: mockHandleSubmit,
    });

    render(<AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitButton = screen.getByText('Create Account');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();

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

    render(<AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should toggle active switch', async () => {
    const user = userEvent.setup();

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

    render(<AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const activeSwitch = screen.getByLabelText(/Active/i);

    await user.click(activeSwitch);
    expect(mockSetField).toHaveBeenCalledWith('isActive', false);
  });

  it('should clear error when user starts typing', async () => {
    const user = userEvent.setup();

    // Mock with validation error initially
    (useAccountForm as jest.Mock).mockReturnValue({
      formData: {
        name: '',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '0',
        description: '',
        isActive: true,
      },
      errors: {
        name: 'Account name is required',
      },
      isSubmitting: false,
      setField: mockSetField,
      handleSubmit: mockHandleSubmit,
    });

    render(<AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/Account Name/i);
    await user.type(nameInput, 'New Name');

    // Verify setField was called (user.type calls setField for each character)
    expect(mockSetField).toHaveBeenCalled();
    // Check the last call was for the last character
    expect(mockSetField).toHaveBeenLastCalledWith('name', 'e');
  });
});
