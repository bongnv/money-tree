import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickEntryRow } from './QuickEntryRow';
import type { Account, Category, TransactionType } from '../../types/models';
import { Group, AccountType } from '../../types/enums';

describe('QuickEntryRow', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Checking',
      type: AccountType.BANK_ACCOUNT,
      currencyId: 'usd',
      initialBalance: 0,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'acc-2',
      name: 'Savings',
      type: AccountType.BANK_ACCOUNT,
      currencyId: 'usd',
      initialBalance: 0,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'acc-3',
      name: 'Credit Card',
      type: AccountType.CREDIT_CARD,
      currencyId: 'usd',
      initialBalance: 0,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Food',
      group: Group.EXPENSE,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'cat-2',
      name: 'Salary',
      group: Group.INCOME,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'cat-3',
      name: 'Transfers',
      group: Group.TRANSFER,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const mockTransactionTypes: TransactionType[] = [
    {
      id: 'type-1',
      name: 'Groceries',
      categoryId: 'cat-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'type-2',
      name: 'Paycheck',
      categoryId: 'cat-2',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'type-3',
      name: 'Account Transfer',
      categoryId: 'cat-3',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const mockOnSubmit = jest.fn();
  const mockOnOpenFullDialog = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should render with all essential fields', () => {
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description (optional)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-01-02')).toBeInTheDocument(); // Today's date
  });

  it('should show from account field for expense transactions', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    // Select expense transaction type
    const typeSelect = screen.getByRole('combobox', { name: '' });
    await user.click(typeSelect);
    await user.click(screen.getByText('Groceries'));

    // From account field should appear
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBe(2); // Type + From
    });
  });

  it('should show to account field for income transactions', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    // Select income transaction type
    const typeSelect = screen.getByRole('combobox', { name: '' });
    await user.click(typeSelect);
    await user.click(screen.getByText('Paycheck'));

    // To account field should appear
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBe(2); // Type + To
    });
  });

  it('should show both account fields for transfer transactions', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    // Select transfer transaction type
    const typeSelect = screen.getByRole('combobox', { name: '' });
    await user.click(typeSelect);
    await user.click(screen.getByText('Account Transfer'));

    // Both fields should appear
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBe(3); // Type + From + To
    });
  });

  it('should submit valid transaction when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    // Fill in the form
    const amountInput = screen.getByPlaceholderText('Amount');
    await user.type(amountInput, '50.00');

    const typeSelect = screen.getByRole('combobox', { name: '' });
    await user.click(typeSelect);
    await user.click(screen.getByText('Groceries'));

    // Wait for from account field to appear and select it
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(1); // Type + From account
    });
    const selects = screen.getAllByRole('combobox');
    const fromAccountSelect = selects[1]; // Second select is from account
    await user.click(fromAccountSelect);
    await user.click(screen.getByText('Checking'));

    // Press Enter to submit
    await user.type(amountInput, '{Enter}');

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        date: '2026-01-02',
        amount: 50.0,
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
        toAccountId: undefined,
        description: undefined,
      });
    });
  });

  it('should clear form after successful submit', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    // Fill in the form
    const amountInput = screen.getByPlaceholderText('Amount');
    await user.type(amountInput, '50.00');

    const typeSelect = screen.getByRole('combobox', { name: '' });
    await user.click(typeSelect);
    await user.click(screen.getByText('Groceries'));

    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBe(2);
    });
    const selects = screen.getAllByRole('combobox');
    const fromAccountSelect = selects[1];
    await user.click(fromAccountSelect);
    await user.click(screen.getByText('Checking'));

    const descriptionInput = screen.getByPlaceholderText('Description (optional)');
    await user.type(descriptionInput, 'Test transaction');

    // Press Enter to submit
    await user.type(amountInput, '{Enter}');

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Amount and description should be cleared
    expect(amountInput).toHaveValue(null);
    expect(descriptionInput).toHaveValue('');

    // Type and account should be kept for rapid entry
    // (Check by looking at the stored value, not displayed text)
  });

  it('should clear form when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    // Fill in the form
    const amountInput = screen.getByPlaceholderText('Amount');
    await user.type(amountInput, '50.00');

    const descriptionInput = screen.getByPlaceholderText('Description (optional)');
    await user.type(descriptionInput, 'Test');

    // Press Escape to clear
    await user.type(amountInput, '{Escape}');

    // All fields should be cleared
    expect(amountInput).toHaveValue(null);
    expect(descriptionInput).toHaveValue('');
  });

  it('should open full dialog when More button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    const moreButton = screen.getByRole('button', { name: /Open full dialog/i });
    await user.click(moreButton);

    expect(mockOnOpenFullDialog).toHaveBeenCalled();
  });

  it('should show validation errors for missing required fields', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    // Try to submit without filling fields
    const amountInput = screen.getByPlaceholderText('Amount');
    await user.type(amountInput, '{Enter}');

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should store defaults in localStorage', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    // Fill and submit the form
    const amountInput = screen.getByPlaceholderText('Amount');
    await user.type(amountInput, '50.00');

    const typeSelect = screen.getByRole('combobox', { name: '' });
    await user.click(typeSelect);
    await user.click(screen.getByText('Groceries'));

    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBe(2);
    });
    const selects = screen.getAllByRole('combobox');
    const fromAccountSelect = selects[1];
    await user.click(fromAccountSelect);
    await user.click(screen.getByText('Checking'));

    await user.type(amountInput, '{Enter}');

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Check localStorage
    const stored = JSON.parse(localStorage.getItem('quickEntryDefaults') || '{}');
    expect(stored.transactionTypeId).toBe('type-1');
    expect(stored.fromAccountId).toBe('acc-1');
  });

  it('should load defaults from localStorage on mount', async () => {
    // Set defaults in localStorage
    localStorage.setItem(
      'quickEntryDefaults',
      JSON.stringify({
        transactionTypeId: 'type-1',
        fromAccountId: 'acc-1',
      })
    );

    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    // From account field should appear because expense type is preselected
    // Wait for the second select to appear (type + from account)
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBe(2);
    });
  });

  it('should disable submit button when form is incomplete', () => {
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    const addButton = screen.getByRole('button', { name: /Add transaction/i });
    expect(addButton).toBeDisabled();
  });

  it('should enable submit button when required fields are filled', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    // Fill required fields
    const amountInput = screen.getByPlaceholderText('Amount');
    await user.type(amountInput, '50.00');

    const typeSelect = screen.getByRole('combobox', { name: '' });
    await user.click(typeSelect);
    await user.click(screen.getByText('Groceries'));

    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /Add transaction/i });
      expect(addButton).not.toBeDisabled();
    });
  });

  it('should handle clicking submit button', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    // Fill in the form
    const amountInput = screen.getByPlaceholderText('Amount');
    await user.type(amountInput, '50.00');

    const typeSelect = screen.getByRole('combobox', { name: '' });
    await user.click(typeSelect);
    await user.click(screen.getByText('Groceries'));

    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBe(2);
    });
    const selects = screen.getAllByRole('combobox');
    const fromAccountSelect = selects[1];
    await user.click(fromAccountSelect);
    await user.click(screen.getByText('Checking'));

    // Click submit button
    const addButton = screen.getByRole('button', { name: /Add transaction/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should handle clicking clear button', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
      />
    );

    // Fill in some fields
    const amountInput = screen.getByPlaceholderText('Amount');
    await user.type(amountInput, '50.00');

    const descriptionInput = screen.getByPlaceholderText('Description (optional)');
    await user.type(descriptionInput, 'Test');

    // Click clear button
    const clearButton = screen.getByRole('button', { name: /Clear form/i });
    await user.click(clearButton);

    // Fields should be cleared
    expect(amountInput).toHaveValue(null);
    expect(descriptionInput).toHaveValue('');
  });

  describe('Keyboard Navigation', () => {
    it('should navigate right through fields with ArrowRight key', async () => {
      const user = userEvent.setup();
      render(
        <QuickEntryRow
          accounts={mockAccounts}
          categories={mockCategories}
          transactionTypes={mockTransactionTypes}
          onSubmit={mockOnSubmit}
          onOpenFullDialog={mockOnOpenFullDialog}
        />
      );

      // Start at date field
      const dateInput = screen.getByDisplayValue(/2026-01-02/);
      dateInput.focus();
      expect(dateInput).toHaveFocus();

      // Press ArrowRight to move to amount
      await user.keyboard('{ArrowRight}');
      const amountInput = screen.getByPlaceholderText('Amount');
      expect(amountInput).toHaveFocus();

      // Press ArrowRight to move to type
      await user.keyboard('{ArrowRight}');
      const typeSelect = screen.getByRole('combobox', { name: '' });
      expect(typeSelect).toHaveFocus();
    });

    it('should navigate left through fields with ArrowLeft key', async () => {
      const user = userEvent.setup();
      render(
        <QuickEntryRow
          accounts={mockAccounts}
          categories={mockCategories}
          transactionTypes={mockTransactionTypes}
          onSubmit={mockOnSubmit}
          onOpenFullDialog={mockOnOpenFullDialog}
        />
      );

      // Start at amount field
      const amountInput = screen.getByPlaceholderText('Amount');
      amountInput.focus();
      expect(amountInput).toHaveFocus();

      // Press ArrowLeft to move to date
      await user.keyboard('{ArrowLeft}');
      const dateInput = screen.getByDisplayValue(/2026-01-02/);
      expect(dateInput).toHaveFocus();

      // Press ArrowLeft to wrap to description
      await user.keyboard('{ArrowLeft}');
      const descriptionInput = screen.getByPlaceholderText('Description (optional)');
      expect(descriptionInput).toHaveFocus();
    });

    it('should wrap around when navigating with arrow keys', async () => {
      const user = userEvent.setup();
      render(
        <QuickEntryRow
          accounts={mockAccounts}
          categories={mockCategories}
          transactionTypes={mockTransactionTypes}
          onSubmit={mockOnSubmit}
          onOpenFullDialog={mockOnOpenFullDialog}
        />
      );

      // Start at description field and press ArrowRight should wrap to date
      const descriptionInput = screen.getByPlaceholderText('Description (optional)');
      descriptionInput.focus();
      await user.keyboard('{ArrowRight}');

      const dateInput = screen.getByDisplayValue(/2026-01-02/);
      expect(dateInput).toHaveFocus();

      // Press ArrowLeft should wrap to description
      await user.keyboard('{ArrowLeft}');
      expect(descriptionInput).toHaveFocus();
    });

    it('should support search in Autocomplete dropdowns', async () => {
      const user = userEvent.setup();
      render(
        <QuickEntryRow
          accounts={mockAccounts}
          categories={mockCategories}
          transactionTypes={mockTransactionTypes}
          onSubmit={mockOnSubmit}
          onOpenFullDialog={mockOnOpenFullDialog}
        />
      );

      // Click on type select to open dropdown
      const typeInputs = screen.getAllByPlaceholderText('Type');
      const typeCombobox = typeInputs.find((input) => input.getAttribute('role') === 'combobox');

      await user.click(typeCombobox!);

      // Type to search
      await user.type(typeCombobox!, 'pay');

      // Should filter and show only Paycheck
      await waitFor(() => {
        expect(screen.getByText('Paycheck')).toBeInTheDocument();
        expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
      });
    });
  });
});
