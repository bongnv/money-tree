import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Group } from '@/types/enums';
import type { Transaction, TransactionType } from '@/types/models';
import { useTransactionFilters } from './useTransactionFilters';

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    date: '2024-01-15',
    description: 'Grocery shopping',
    amount: 100,
    transactionTypeId: 'type-1',
    fromAccountId: 'acc-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isDeleted: false,
  },
  {
    id: 'tx-2',
    date: '2024-02-10',
    description: 'Salary payment',
    amount: 5000,
    transactionTypeId: 'type-2',
    toAccountId: 'acc-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isDeleted: false,
  },
];

const mockTransactionTypes: TransactionType[] = [
  {
    id: 'type-1',
    name: 'Groceries',
    categoryId: 'cat-1',
    group: Group.EXPENSE,
    isActive: true,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'type-2',
    name: 'Salary',
    categoryId: 'cat-2',
    group: Group.INCOME,
    isActive: true,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('useTransactionFilters', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );

  it('should initialize with year-to-date filters', () => {
    const { result } = renderHook(
      () =>
        useTransactionFilters({
          transactions: mockTransactions,
          transactionTypes: mockTransactionTypes,
        }),
      { wrapper }
    );

    // Check year-to-date: starts with current year and -01-01
    expect(result.current.filters.dateFrom).toContain('-01-01');
    // Check dateTo is a valid date format
    expect(result.current.filters.dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.current.filters.accountIds).toEqual([]);
    expect(result.current.filters.categoryIds).toEqual([]);
    expect(result.current.filters.transactionTypeId).toBe('');
    expect(result.current.filters.searchText).toBe('');
    expect(result.current.filters.group).toBe('');
  });

  it('should filter transactions based on filters', () => {
    const { result } = renderHook(
      () =>
        useTransactionFilters({
          transactions: mockTransactions,
          transactionTypes: mockTransactionTypes,
        }),
      { wrapper }
    );

    // Reset filters to show all transactions
    act(() => {
      result.current.setFilters({
        dateFrom: '',
        dateTo: '',
        accountIds: [],
        categoryIds: [],
        transactionTypeId: '',
        searchText: '',
        group: '',
      });
    });

    expect(result.current.filteredTransactions.length).toBe(2);
  });

  it('should update filters using setFilters', () => {
    const { result } = renderHook(
      () =>
        useTransactionFilters({
          transactions: mockTransactions,
          transactionTypes: mockTransactionTypes,
        }),
      { wrapper }
    );

    act(() => {
      result.current.setFilters({
        dateFrom: '2024-02-01',
        dateTo: '2024-02-28',
        accountIds: ['acc-1'],
        categoryIds: [],
        transactionTypeId: '',
        searchText: '',
        group: '',
      });
    });

    expect(result.current.filters.dateFrom).toBe('2024-02-01');
    expect(result.current.filters.dateTo).toBe('2024-02-28');
    expect(result.current.filters.accountIds).toEqual(['acc-1']);
  });

  it('should filter by category', () => {
    const { result } = renderHook(
      () =>
        useTransactionFilters({
          transactions: mockTransactions,
          transactionTypes: mockTransactionTypes,
        }),
      { wrapper }
    );

    act(() => {
      result.current.setFilters({
        dateFrom: '',
        dateTo: '',
        accountIds: [],
        categoryIds: ['cat-1'],
        transactionTypeId: '',
        searchText: '',
        group: '',
      });
    });

    expect(result.current.filteredTransactions).toHaveLength(1);
    expect(result.current.filteredTransactions[0].id).toBe('tx-1');
  });

  it('should filter by transaction type', () => {
    const { result } = renderHook(
      () =>
        useTransactionFilters({
          transactions: mockTransactions,
          transactionTypes: mockTransactionTypes,
        }),
      { wrapper }
    );

    act(() => {
      result.current.setFilters({
        dateFrom: '',
        dateTo: '',
        accountIds: [],
        categoryIds: [],
        transactionTypeId: 'type-2',
        searchText: '',
        group: '',
      });
    });

    expect(result.current.filteredTransactions).toHaveLength(1);
    expect(result.current.filteredTransactions[0].id).toBe('tx-2');
  });

  it('should filter by search text', () => {
    const { result } = renderHook(
      () =>
        useTransactionFilters({
          transactions: mockTransactions,
          transactionTypes: mockTransactionTypes,
        }),
      { wrapper }
    );

    act(() => {
      result.current.setFilters({
        dateFrom: '',
        dateTo: '',
        accountIds: [],
        categoryIds: [],
        transactionTypeId: '',
        searchText: 'grocery',
        group: '',
      });
    });

    expect(result.current.filteredTransactions).toHaveLength(1);
    expect(result.current.filteredTransactions[0].id).toBe('tx-1');
  });

  it('should filter by group', () => {
    const { result } = renderHook(
      () =>
        useTransactionFilters({
          transactions: mockTransactions,
          transactionTypes: mockTransactionTypes,
        }),
      { wrapper }
    );

    act(() => {
      result.current.setFilters({
        dateFrom: '',
        dateTo: '',
        accountIds: [],
        categoryIds: [],
        transactionTypeId: '',
        searchText: '',
        group: Group.INCOME,
      });
    });

    expect(result.current.filteredTransactions).toHaveLength(1);
    expect(result.current.filteredTransactions[0].id).toBe('tx-2');
  });

  it('should return empty array when transactions are undefined', () => {
    const { result } = renderHook(
      () =>
        useTransactionFilters({
          transactions: undefined,
          transactionTypes: mockTransactionTypes,
        }),
      { wrapper }
    );

    expect(result.current.filteredTransactions).toEqual([]);
  });
});
