import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders as render } from '@/test-utils';
import '@testing-library/jest-dom';
import { Group, AccountType, CurrencyCode } from '@/types/enums';
import type { Account, Category, TransactionType } from '@/types/models';
import { TransactionFilters, TransactionFiltersState } from './TransactionFilters';

describe('TransactionFilters', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Checking',
      type: AccountType.BANK_ACCOUNT,
      currencyCode: CurrencyCode.USD,
      initialBalance: 1000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isDeleted: false,
    },
    {
      id: 'acc-2',
      name: 'Savings',
      type: AccountType.BANK_ACCOUNT,
      currencyCode: CurrencyCode.USD,
      initialBalance: 5000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isDeleted: false,
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Food & Dining',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isDeleted: false,
    },
    {
      id: 'cat-2',
      name: 'Salary',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isDeleted: false,
    },
  ];

  const mockTransactionTypes: TransactionType[] = [
    {
      id: 'tt-1',
      name: 'Groceries',
      categoryId: 'cat-1',
      group: Group.EXPENSE,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isActive: true,
      isDeleted: false,
    },
    {
      id: 'tt-2',
      name: 'Monthly Salary',
      categoryId: 'cat-2',
      group: Group.INCOME,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isActive: true,
      isDeleted: false,
    },
  ];

  const defaultFilters: TransactionFiltersState = {
    dateFrom: '',
    dateTo: '',
    accountIds: [],
    categoryIds: [],
    transactionTypeId: '',
    searchText: '',
    group: '',
  };

  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all filter fields', () => {
    render(
      <TransactionFilters
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByRole('combobox', { name: /period/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/accounts/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/group/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categories/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/transaction type/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('should update group filter', async () => {
    const user = userEvent.setup();
    render(
      <TransactionFilters
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const groupSelect = screen.getByLabelText(/group/i);
    await user.click(groupSelect);

    const expenseOption = await screen.findByRole('option', { name: /expense/i });
    await user.click(expenseOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      group: Group.EXPENSE,
    });
  });

  it('should update category filter', async () => {
    const user = userEvent.setup();
    render(
      <TransactionFilters
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const categorySelect = screen.getByLabelText(/categories/i);
    await user.click(categorySelect);

    const categoryOption = await screen.findByRole('option', { name: /food & dining/i });
    await user.click(categoryOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      categoryIds: ['cat-1'],
    });
  });

  it('should update transaction type filter', async () => {
    const user = userEvent.setup();
    render(
      <TransactionFilters
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const typeSelect = screen.getByLabelText(/transaction type/i);
    await user.click(typeSelect);

    const typeOption = await screen.findByRole('option', { name: /groceries/i });
    await user.click(typeOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      transactionTypeId: 'tt-1',
    });
  });

  it('should update search text', async () => {
    const user = userEvent.setup();
    render(
      <TransactionFilters
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'coffee');

    // Verify onFiltersChange was called multiple times (once per keystroke)
    expect(mockOnFiltersChange).toHaveBeenCalled();

    // Verify one of the calls included 'c' in searchText
    const calls = mockOnFiltersChange.mock.calls;
    const hasSearchText = calls.some((call) => call[0].searchText && call[0].searchText.length > 0);
    expect(hasSearchText).toBe(true);
  });

  it('should update account filter with multiple selections', async () => {
    const user = userEvent.setup();
    render(
      <TransactionFilters
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const accountSelect = screen.getByLabelText(/accounts/i);
    await user.click(accountSelect);

    const checkingOption = await screen.findByRole('option', { name: /checking/i });
    await user.click(checkingOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      accountIds: ['acc-1'],
    });
  });

  it('should display selected account chips', () => {
    const filtersWithAccounts: TransactionFiltersState = {
      ...defaultFilters,
      accountIds: ['acc-1', 'acc-2'],
    };

    render(
      <TransactionFilters
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        filters={filtersWithAccounts}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Checking')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
  });

  it('should clear all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const filtersWithData: TransactionFiltersState = {
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      accountIds: ['acc-1'],
      categoryIds: ['cat-1'],
      transactionTypeId: 'tt-1',
      searchText: 'coffee',
      group: Group.EXPENSE,
    };

    render(
      <TransactionFilters
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        filters={filtersWithData}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      dateFrom: '',
      dateTo: '',
      accountIds: [],
      categoryIds: [],
      transactionTypeId: '',
      searchText: '',
      group: '',
    });
  });

  it('should disable clear button when no filters are active', () => {
    render(
      <TransactionFilters
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeDisabled();
  });

  it('should enable clear button when filters are active', () => {
    const filtersWithData: TransactionFiltersState = {
      ...defaultFilters,
      searchText: 'test',
    };

    render(
      <TransactionFilters
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        filters={filtersWithData}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).not.toBeDisabled();
  });

  it('should display all categories in dropdown', async () => {
    const user = userEvent.setup();
    render(
      <TransactionFilters
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const categorySelect = screen.getByLabelText(/categories/i);
    await user.click(categorySelect);

    expect(await screen.findByRole('option', { name: /food & dining/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /salary/i })).toBeInTheDocument();
  });

  it('should display all transaction types in dropdown', async () => {
    const user = userEvent.setup();
    render(
      <TransactionFilters
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const typeSelect = screen.getByLabelText(/transaction type/i);
    await user.click(typeSelect);

    expect(await screen.findByRole('option', { name: /all types/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /groceries/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /monthly salary/i })).toBeInTheDocument();
  });

  it('should display all groups in dropdown', async () => {
    const user = userEvent.setup();
    render(
      <TransactionFilters
        accounts={mockAccounts}
        categories={mockCategories}
        transactionTypes={mockTransactionTypes}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const groupSelect = screen.getByLabelText(/group/i);
    await user.click(groupSelect);

    expect(await screen.findByRole('option', { name: /all groups/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /^expense$/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /^income$/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /^transfer$/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /^asset purchase$/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /^asset sale$/i })).toBeInTheDocument();
  });
});
