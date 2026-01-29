import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionTypeForm } from './TransactionTypeForm';
import { Group } from '../../types/enums';
import type { Category, TransactionType, Account } from '../../types/models';

// Mock Dexie hooks
const mockUseAccounts = jest.fn();
const mockAddTransactionType = jest.fn();
const mockUpdateTransactionType = jest.fn();
const mockDeleteTransactionType = jest.fn();

// Mock cloudSync
jest.mock('../../services/cloudSync.service', () => ({
  getCloudSyncService: jest.fn(() => ({
    debouncedSync: jest.fn(),
  })),
}));

describe('TransactionTypeForm', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Checking Account',
      type: 'bank_account',
      currencyCode: 'USD',
      initialBalance: 1000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'acc-2',
      name: 'Savings Account',
      type: 'bank_account',
      currencyCode: 'USD',
      initialBalance: 5000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Groceries',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'cat-2',
      name: 'Salary',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccounts.mockReturnValue(mockAccounts);
  });

  it('should render empty form for new transaction type', () => {
    render(
      <TransactionTypeForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/transaction type name/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('should render form with transaction type data for editing', () => {
    const transactionType: TransactionType = {
      id: 'tt-1',
      name: 'Supermarket',
      categoryId: 'cat-1',
      group: Group.EXPENSE,
      description: 'Grocery shopping',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    render(
      <TransactionTypeForm
        transactionType={transactionType}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/transaction type name/i)).toHaveValue('Supermarket');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Grocery shopping');
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  it('should show validation error when name is empty', async () => {
    const user = userEvent.setup();
    render(
      <TransactionTypeForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/transaction type name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error when category is not selected', async () => {
    const user = userEvent.setup();
    render(
      <TransactionTypeForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await user.type(screen.getByLabelText(/transaction type name/i), 'Test Type');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/category is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit valid form data', async () => {
    const user = userEvent.setup();
    render(
      <TransactionTypeForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await user.type(screen.getByLabelText(/transaction type name/i), 'Restaurant');
    await user.click(screen.getByLabelText(/group/i));
    await user.click(screen.getByRole('option', { name: /^income$/i }));
    await user.click(screen.getByLabelText(/category/i));
    await user.click(screen.getByRole('option', { name: /groceries/i }));
    await user.type(screen.getByLabelText(/description/i), 'Dining out');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Restaurant',
        categoryId: 'cat-1',
        group: Group.INCOME,
        description: 'Dining out',
      });
    });
  });

  it('should submit without optional description', async () => {
    const user = userEvent.setup();
    render(
      <TransactionTypeForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await user.type(screen.getByLabelText(/transaction type name/i), 'Gas');
    await user.click(screen.getByLabelText(/group/i));
    await user.click(screen.getByRole('option', { name: /^income$/i }));
    await user.click(screen.getByLabelText(/category/i));
    await user.click(screen.getByRole('option', { name: /groceries/i }));

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Gas',
        categoryId: 'cat-1',
        group: Group.INCOME,
        description: undefined,
      });
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TransactionTypeForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should have group dropdown with 5 options', () => {
    render(
      <TransactionTypeForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const groupField = screen.getByLabelText(/group/i);
    expect(groupField).toBeInTheDocument();
  });

  it('should clear error when user starts typing', async () => {
    const user = userEvent.setup();
    render(
      <TransactionTypeForm
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Submit to trigger validation error
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/transaction type name is required/i)).toBeInTheDocument();
    });

    // Start typing to clear error
    await user.type(screen.getByLabelText(/transaction type name/i), 'Test');

    expect(screen.queryByText(/transaction type name is required/i)).not.toBeInTheDocument();
  });

  describe('Default Account Fields', () => {
    it('should show default account fields when group is TRANSFER', async () => {
      const user = userEvent.setup();
      render(
        <TransactionTypeForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Select TRANSFER group
      const groupSelect = screen.getByLabelText(/group/i);
      await user.click(groupSelect);
      await user.click(screen.getByRole('option', { name: /transfer/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/default from account/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/default to account/i)).toBeInTheDocument();
      });
    });

    it('should not show default account fields when group is not TRANSFER', () => {
      render(
        <TransactionTypeForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByLabelText(/default from account/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/default to account/i)).not.toBeInTheDocument();
    });

    it('should clear default accounts when changing from TRANSFER to another group', async () => {
      const user = userEvent.setup();
      render(
        <TransactionTypeForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Select TRANSFER group
      const groupSelect = screen.getByLabelText(/group/i);
      await user.click(groupSelect);
      await user.click(screen.getByRole('option', { name: /transfer/i }));

      // Select default accounts
      await waitFor(() => {
        expect(screen.getByLabelText(/default from account/i)).toBeInTheDocument();
      });

      const fromAccountSelect = screen.getByLabelText(/default from account/i);
      await user.click(fromAccountSelect);
      await user.click(screen.getByRole('option', { name: /checking account/i }));

      // Change group to EXPENSE
      await user.click(groupSelect);
      await user.click(screen.getByRole('option', { name: /expense/i }));

      // Default account fields should be hidden
      await waitFor(() => {
        expect(screen.queryByLabelText(/default from account/i)).not.toBeInTheDocument();
      });
    });

    it('should submit with default accounts when set', async () => {
      const user = userEvent.setup();
      render(
        <TransactionTypeForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in required fields
      await user.type(screen.getByLabelText(/transaction type name/i), 'Salary Transfer');

      const categorySelect = screen.getByLabelText(/category/i);
      await user.click(categorySelect);
      await user.click(screen.getByRole('option', { name: /salary/i }));

      // Select TRANSFER group
      const groupSelect = screen.getByLabelText(/group/i);
      await user.click(groupSelect);
      await user.click(screen.getByRole('option', { name: /transfer/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/default from account/i)).toBeInTheDocument();
      });

      // Select default accounts
      const fromAccountSelect = screen.getByLabelText(/default from account/i);
      await user.click(fromAccountSelect);
      await user.click(screen.getByRole('option', { name: /checking account/i }));

      const toAccountSelect = screen.getByLabelText(/default to account/i);
      await user.click(toAccountSelect);
      await user.click(screen.getByRole('option', { name: /savings account/i }));

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Salary Transfer',
          categoryId: 'cat-2',
          group: Group.TRANSFER,
          description: undefined,
          defaultFromAccountId: 'acc-1',
          defaultToAccountId: 'acc-2',
        });
      });
    });

    it('should submit without default accounts when not set', async () => {
      const user = userEvent.setup();
      render(
        <TransactionTypeForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in required fields
      await user.type(screen.getByLabelText(/transaction type name/i), 'General Transfer');

      const categorySelect = screen.getByLabelText(/category/i);
      await user.click(categorySelect);
      await user.click(screen.getByRole('option', { name: /groceries/i }));

      // Select TRANSFER group
      const groupSelect = screen.getByLabelText(/group/i);
      await user.click(groupSelect);
      await user.click(screen.getByRole('option', { name: /transfer/i }));

      // Submit form without selecting default accounts
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'General Transfer',
          categoryId: 'cat-1',
          group: Group.TRANSFER,
          description: undefined,
          defaultFromAccountId: undefined,
          defaultToAccountId: undefined,
        });
      });
    });
  });
});
