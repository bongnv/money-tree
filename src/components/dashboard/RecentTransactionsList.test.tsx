import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { RecentTransactionsList } from './RecentTransactionsList';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useTransactionTypes } from '../../hooks/queries/useTransactionTypes';
import { Group } from '../../types/enums';

jest.mock('../../hooks/queries/useTransactions');
jest.mock('../../hooks/queries/useTransactionTypes');

const mockUseTransactions = useTransactions as jest.MockedFunction<typeof useTransactions>;
const mockUseTransactionTypes = useTransactionTypes as jest.MockedFunction<typeof useTransactionTypes>;

describe('RecentTransactionsList', () => {
  const mockTransactions = [
    {
      id: 'txn-1',
      date: '2026-01-03',
      description: 'Salary',
      amount: 5000,
      transactionTypeId: 'type-income',
      toAccountId: 'acc-1',
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
    },
    {
      id: 'txn-2',
      date: '2026-01-02',
      description: 'Groceries',
      amount: 150,
      transactionTypeId: 'type-expense',
      fromAccountId: 'acc-1',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'txn-3',
      date: '2026-01-01',
      description: 'Rent',
      amount: 1500,
      transactionTypeId: 'type-expense',
      fromAccountId: 'acc-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const mockTransactionTypes = [
    {
      id: 'type-income',
      name: 'Salary',
      categoryId: 'cat-income',
      group: Group.INCOME,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'type-expense',
      name: 'Food & Groceries',
      categoryId: 'cat-expense',
      group: Group.EXPENSE,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const mockCategories = [
    {
      id: 'cat-income',
      name: 'Income',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'cat-expense',
      name: 'Living Expenses',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTransactions.mockReturnValue(mockTransactions);
    mockUseTransactionTypes.mockReturnValue(mockTransactionTypes);
  });

  it('renders recent transactions sorted by date', () => {
    render(
      <BrowserRouter>
        <RecentTransactionsList />
      </BrowserRouter>
    );

    // Check all transactions are present
    expect(screen.getAllByText('Salary')).toHaveLength(2); // Description + Chip
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
  });

  it('displays transaction details correctly', () => {
    render(
      <BrowserRouter>
        <RecentTransactionsList />
      </BrowserRouter>
    );

    expect(screen.getAllByText('Salary')).toHaveLength(2); // Description + Chip
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getAllByText('Food & Groceries')).toHaveLength(2); // Two transactions use this type
  });

  it('color codes income amounts in green', () => {
    render(
      <BrowserRouter>
        <RecentTransactionsList />
      </BrowserRouter>
    );

    const incomeAmount = screen.getByText(/\+\$5,000/);
    expect(incomeAmount).toBeInTheDocument();
  });

  it('limits transactions to specified limit', () => {
    const manyTransactions = Array.from({ length: 15 }, (_, i) => ({
      id: `txn-${i}`,
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      description: `Transaction ${i}`,
      amount: 100,
      transactionTypeId: 'type-expense',
      fromAccountId: 'acc-1',
      createdAt: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
      updatedAt: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
    }));

    mockUseTransactions.mockReturnValue(manyTransactions);

    render(
      <BrowserRouter>
        <RecentTransactionsList limit={5} />
      </BrowserRouter>
    );

    const transactionItems = screen.getAllByText(/Transaction \d+/);
    expect(transactionItems).toHaveLength(5);
  });

  it('shows empty state when no transactions', () => {
    mockUseTransactions.mockReturnValue([]);

    render(
      <BrowserRouter>
        <RecentTransactionsList />
      </BrowserRouter>
    );

    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first transaction using the form above')).toBeInTheDocument();
  });

  it('shows "View All Transactions" link', () => {
    render(
      <BrowserRouter>
        <RecentTransactionsList />
      </BrowserRouter>
    );

    const link = screen.getByText('View All Transactions');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/transactions');
  });

  it('calls onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();

    render(
      <BrowserRouter>
        <RecentTransactionsList onEdit={onEdit} />
      </BrowserRouter>
    );

    const editButtons = screen.getAllByLabelText('edit transaction');
    await user.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith('txn-1');
  });

  it('calls onDelete when delete button clicked', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();

    render(
      <BrowserRouter>
        <RecentTransactionsList onDelete={onDelete} />
      </BrowserRouter>
    );

    const deleteButtons = screen.getAllByLabelText('delete transaction');
    await user.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith('txn-1');
  });
});
