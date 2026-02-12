import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Group, AccountType, CurrencyCode } from '@/types/enums';
import type { Account, Category, Transaction, TransactionType } from '@/types/models';
import { QuickEntryRow } from './QuickEntryRow';

describe('QuickEntryRow', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Checking',
      type: AccountType.BANK_ACCOUNT,
      currencyCode: CurrencyCode.USD,
      initialBalance: 0,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isDeleted: false,
    },
    {
      id: 'acc-2',
      name: 'Savings',
      type: AccountType.BANK_ACCOUNT,
      currencyCode: CurrencyCode.USD,
      initialBalance: 0,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isDeleted: false,
    },
    {
      id: 'acc-3',
      name: 'Credit Card',
      type: AccountType.CREDIT_CARD,
      currencyCode: CurrencyCode.USD,
      initialBalance: 0,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isDeleted: false,
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Food',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isDeleted: false,
    },
    {
      id: 'cat-2',
      name: 'Salary',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isDeleted: false,
    },
    {
      id: 'cat-3',
      name: 'Transfers',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isDeleted: false,
    },
  ];

  const mockTransactionTypes: TransactionType[] = [
    {
      id: 'type-1',
      name: 'Groceries',
      categoryId: 'cat-1',
      group: Group.EXPENSE,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isActive: false,
      isDeleted: false,
    },
    {
      id: 'type-2',
      name: 'Paycheck',
      categoryId: 'cat-2',
      group: Group.INCOME,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isActive: false,
      isDeleted: false,
    },
    {
      id: 'type-3',
      name: 'Account Transfer',
      categoryId: 'cat-3',
      group: Group.TRANSFER,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isActive: false,
      isDeleted: false,
    },
    {
      id: 'type-4',
      name: 'Salary Deposit',
      categoryId: 'cat-3',
      group: Group.TRANSFER,
      defaultFromAccountId: 'acc-1',
      defaultToAccountId: 'acc-2',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isActive: false,
      isDeleted: false,
    },
  ];

  const mockTransactions: Transaction[] = [];

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
        transactions={mockTransactions}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
        manualAssets={[]}
      />
    );

    expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description (optional)')).toBeInTheDocument();
    // Verify there are textboxes (date picker creates one)
    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes.length).toBeGreaterThan(0);
  });

  it('should show from account field for expense transactions', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        transactions={mockTransactions}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
        manualAssets={[]}
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
        transactions={mockTransactions}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
        manualAssets={[]}
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
        transactions={mockTransactions}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
        manualAssets={[]}
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
        transactions={mockTransactions}
        manualAssets={[]}
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
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50.0,
          transactionTypeId: 'type-1',
          fromAccountId: 'acc-1',
          toAccountId: undefined,
          description: undefined,
        })
      );
      // Just verify date exists and is in correct format
      const call = mockOnSubmit.mock.calls[0][0];
      expect(call.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('should clear form after successful submit', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        transactions={mockTransactions}
        manualAssets={[]}
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

    // Amount and description should be cleared for next entry
    expect(amountInput).toHaveValue(null);
    expect(descriptionInput).toHaveValue('');

    // Type and accounts should be kept for rapid entry
  });

  it('should clear form when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <QuickEntryRow
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        transactions={mockTransactions}
        manualAssets={[]}
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
        transactions={mockTransactions}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
        manualAssets={[]}
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
        transactions={mockTransactions}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
        manualAssets={[]}
      />
    );

    // Try to submit without filling fields
    const amountInput = screen.getByPlaceholderText('Amount');
    await user.type(amountInput, '{Enter}');

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Amount is required')).toBeInTheDocument();
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
        transactions={mockTransactions}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
        manualAssets={[]}
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
        transactions={mockTransactions}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
        manualAssets={[]}
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
        transactions={mockTransactions}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
        manualAssets={[]}
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
        transactions={mockTransactions}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
        manualAssets={[]}
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
        transactions={mockTransactions}
        manualAssets={[]}
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
        transactions={mockTransactions}
        onSubmit={mockOnSubmit}
        onOpenFullDialog={mockOnOpenFullDialog}
        manualAssets={[]}
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
          transactions={mockTransactions}
          onSubmit={mockOnSubmit}
          onOpenFullDialog={mockOnOpenFullDialog}
          manualAssets={[]}
        />
      );

      // Start at amount field (skip date field for MUI DatePicker compatibility)
      const amountInput = screen.getByPlaceholderText('Amount');
      amountInput.focus();
      expect(amountInput).toHaveFocus();

      // Press ArrowRight to move to type
      await user.keyboard('{ArrowRight}');
      const typeSelect = screen.getByRole('combobox', { name: '' });
      expect(typeSelect).toHaveFocus();
    });

    it('should support search in Autocomplete dropdowns', async () => {
      const user = userEvent.setup();
      render(
        <QuickEntryRow
          accounts={mockAccounts}
          categories={mockCategories}
          transactionTypes={mockTransactionTypes}
          transactions={mockTransactions}
          onSubmit={mockOnSubmit}
          onOpenFullDialog={mockOnOpenFullDialog}
          manualAssets={[]}
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

  describe('Default Account Fields', () => {
    it('should show disabled account fields when transaction type has defaults', async () => {
      const user = userEvent.setup();
      render(
        <QuickEntryRow
          accounts={mockAccounts}
          categories={mockCategories}
          transactionTypes={mockTransactionTypes}
          transactions={mockTransactions}
          onSubmit={mockOnSubmit}
          onOpenFullDialog={mockOnOpenFullDialog}
          manualAssets={[]}
        />
      );

      // Select transaction type with defaults
      const typeInputs = screen.getAllByPlaceholderText('Type');
      const typeCombobox = typeInputs.find((input) => input.getAttribute('role') === 'combobox');
      await user.click(typeCombobox!);
      await user.click(screen.getByText('Salary Deposit'));

      // Account fields should be visible but disabled
      await waitFor(() => {
        expect(screen.getByPlaceholderText('From')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('To')).toBeInTheDocument();
      });
    });

    it('should show disabled account fields with default values', async () => {
      const user = userEvent.setup();
      render(
        <QuickEntryRow
          accounts={mockAccounts}
          categories={mockCategories}
          transactionTypes={mockTransactionTypes}
          transactions={mockTransactions}
          onSubmit={mockOnSubmit}
          onOpenFullDialog={mockOnOpenFullDialog}
          manualAssets={[]}
        />
      );

      // Select transaction type with defaults
      const typeInputs = screen.getAllByPlaceholderText('Type');
      const typeCombobox = typeInputs.find((input) => input.getAttribute('role') === 'combobox');
      await user.click(typeCombobox!);
      await user.click(screen.getByText('Salary Deposit'));

      // Should show disabled account fields with default values
      await waitFor(() => {
        const fromInput = screen.getByPlaceholderText('From');
        const toInput = screen.getByPlaceholderText('To');

        expect(fromInput).toBeInTheDocument();
        expect(toInput).toBeInTheDocument();
        expect(fromInput).toHaveValue('Checking');
        expect(toInput).toHaveValue('Savings');

        // Fields should be disabled (Autocomplete adds aria-disabled)
        const fromAutocomplete = fromInput.closest('.MuiAutocomplete-root');
        const toAutocomplete = toInput.closest('.MuiAutocomplete-root');
        expect(
          fromAutocomplete?.querySelector('.MuiAutocomplete-endAdornment button')
        ).toBeDisabled();
        expect(
          toAutocomplete?.querySelector('.MuiAutocomplete-endAdornment button')
        ).toBeDisabled();
      });
    });

    it('should show account fields when transaction type has no defaults', async () => {
      const user = userEvent.setup();
      render(
        <QuickEntryRow
          accounts={mockAccounts}
          categories={mockCategories}
          transactionTypes={mockTransactionTypes}
          transactions={mockTransactions}
          onSubmit={mockOnSubmit}
          onOpenFullDialog={mockOnOpenFullDialog}
          manualAssets={[]}
        />
      );

      // Select transaction type without defaults
      const typeInputs = screen.getAllByPlaceholderText('Type');
      const typeCombobox = typeInputs.find((input) => input.getAttribute('role') === 'combobox');
      await user.click(typeCombobox!);
      await user.click(screen.getByText('Account Transfer'));

      // Account fields should be visible
      await waitFor(() => {
        expect(screen.getByPlaceholderText('From')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('To')).toBeInTheDocument();
      });
    });

    it('should submit with default accounts', async () => {
      const user = userEvent.setup();
      render(
        <QuickEntryRow
          accounts={mockAccounts}
          categories={mockCategories}
          transactionTypes={mockTransactionTypes}
          transactions={mockTransactions}
          onSubmit={mockOnSubmit}
          onOpenFullDialog={mockOnOpenFullDialog}
          manualAssets={[]}
        />
      );

      // Fill in amount
      const amountInput = screen.getByPlaceholderText('Amount');
      await user.type(amountInput, '1000');

      // Select transaction type with defaults
      const typeInputs = screen.getAllByPlaceholderText('Type');
      const typeCombobox = typeInputs.find((input) => input.getAttribute('role') === 'combobox');
      await user.click(typeCombobox!);
      await user.click(screen.getByText('Salary Deposit'));

      // Submit
      const addButton = screen.getByRole('button', { name: /add transaction/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 1000,
            transactionTypeId: 'type-4',
            fromAccountId: 'acc-1',
            toAccountId: 'acc-2',
          })
        );
      });
    });
  });
});
