/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RecentTransactionsList } from './RecentTransactionsList';
import { useStore } from '@/contexts/StoreContext';
import { Group, CurrencyCode } from '@/types/enums';

jest.mock('@/contexts/StoreContext');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('RecentTransactionsList', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      date: '2024-01-15',
      description: 'Grocery shopping',
      amount: 50,
      transactionTypeId: 'type-1',
      fromAccountId: 'acc-1',
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'tx-2',
      date: '2024-01-16',
      description: 'Salary',
      amount: 5000,
      transactionTypeId: 'type-2',
      toAccountId: 'acc-1',
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockTransactionTypes = [
    {
      id: 'type-1',
      name: 'Groceries',
      categoryId: 'cat-1',
      group: Group.EXPENSE,
      isActive: true,
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'type-2',
      name: 'Salary',
      categoryId: 'cat-2',
      group: Group.INCOME,
      isActive: true,
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const mockAccounts = [
    {
      id: 'acc-1',
      name: 'Checking',
      type: 'bank_account' as any,
      currencyCode: CurrencyCode.USD,
      initialBalance: 1000,
      isActive: true,
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show empty state when no transactions', () => {
    mockUseStore.mockReturnValue({
      transactions: [],
      transactionTypes: mockTransactionTypes,
      accounts: mockAccounts,
    } as any);

    renderWithRouter(<RecentTransactionsList />);

    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
  });

  it('should show empty state when transactions is null/undefined', () => {
    mockUseStore.mockReturnValue({
      transactions: null,
      transactionTypes: mockTransactionTypes,
      accounts: mockAccounts,
    } as any);

    renderWithRouter(<RecentTransactionsList />);

    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
  });

  it('should render recent transactions', () => {
    mockUseStore.mockReturnValue({
      transactions: mockTransactions,
      transactionTypes: mockTransactionTypes,
      accounts: mockAccounts,
    } as any);

    renderWithRouter(<RecentTransactionsList />);

    expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
    expect(screen.getByText('View All Transactions')).toBeInTheDocument();
  });

  it('should sort transactions by date (newest first)', () => {
    const txA = {
      ...mockTransactions[0],
      id: 'tx-a',
      date: '2024-01-10',
      description: 'Older transaction',
    };
    const txB = {
      ...mockTransactions[0],
      id: 'tx-b',
      date: '2024-01-20',
      description: 'Newer transaction',
    };

    mockUseStore.mockReturnValue({
      transactions: [txA, txB],
      transactionTypes: mockTransactionTypes,
      accounts: mockAccounts,
    } as any);

    renderWithRouter(<RecentTransactionsList />);

    const descriptions = screen.getAllByText(/Older transaction|Newer transaction/);
    // Newer (Jan 20) should come before Older (Jan 10)
    expect(descriptions[0]).toHaveTextContent('Newer transaction');
    expect(descriptions[1]).toHaveTextContent('Older transaction');
  });

  it('should limit transactions by limit prop', () => {
    const manyTransactions = Array.from({ length: 20 }, (_, i) => ({
      ...mockTransactions[0],
      id: `tx-${i}`,
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      description: `Transaction ${i}`,
    }));

    mockUseStore.mockReturnValue({
      transactions: manyTransactions,
      transactionTypes: mockTransactionTypes,
      accounts: mockAccounts,
    } as any);

    renderWithRouter(<RecentTransactionsList limit={5} />);

    // Should only show 5 transactions
    const items = screen.getAllByText(/Transaction \d+/);
    expect(items).toHaveLength(5);
  });

  it('should show edit button when onEdit is provided', () => {
    mockUseStore.mockReturnValue({
      transactions: [mockTransactions[0]],
      transactionTypes: mockTransactionTypes,
      accounts: mockAccounts,
    } as any);

    const onEdit = jest.fn();
    renderWithRouter(<RecentTransactionsList onEdit={onEdit} />);

    const editButton = screen.getByLabelText('edit transaction');
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith('tx-1');
  });

  it('should show delete button when onDelete is provided', () => {
    mockUseStore.mockReturnValue({
      transactions: [mockTransactions[0]],
      transactionTypes: mockTransactionTypes,
      accounts: mockAccounts,
    } as any);

    const onDelete = jest.fn();
    renderWithRouter(<RecentTransactionsList onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText('delete transaction');
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith('tx-1');
  });

  it('should handle unknown transaction types', () => {
    mockUseStore.mockReturnValue({
      transactions: [{ ...mockTransactions[0], transactionTypeId: 'unknown' }],
      transactionTypes: mockTransactionTypes,
      accounts: mockAccounts,
    } as any);

    renderWithRouter(<RecentTransactionsList />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('should handle transactions without account IDs', () => {
    mockUseStore.mockReturnValue({
      transactions: [{ ...mockTransactions[0], fromAccountId: undefined, toAccountId: undefined }],
      transactionTypes: mockTransactionTypes,
      accounts: mockAccounts,
    } as any);

    renderWithRouter(<RecentTransactionsList />);

    // Should still render without error
    expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
  });
});
