import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import type { Transaction, TransactionType } from '@/types/models';
import { Group } from '@/types/enums';
import { getTodayDate } from '@/utils/date.utils';
import { useTransactionService } from '@/hooks/useServices';

export interface TransactionFiltersState {
  dateFrom: string;
  dateTo: string;
  accountIds: string[];
  categoryIds: string[];
  transactionTypeId: string;
  searchText: string;
  group: Group | '';
}

interface UseTransactionFiltersParams {
  transactions: Transaction[] | undefined;
  transactionTypes: TransactionType[] | undefined;
}

export function useTransactionFilters({
  transactions,
  transactionTypes,
}: UseTransactionFiltersParams) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const transactionService = useTransactionService();

  // Default to Year to Date
  const today = getTodayDate();
  const yearStart = `${today.slice(0, 4)}-01-01`;

  const [filters, setFilters] = useState<TransactionFiltersState>({
    dateFrom: yearStart,
    dateTo: today,
    accountIds: [],
    categoryIds: [],
    transactionTypeId: '',
    searchText: '',
    group: '',
  });

  // Read URL parameters and location state, and apply to filters on mount (only once)
  useEffect(() => {
    // Read from search params
    const categoryId = searchParams.get('categoryId');
    const transactionTypeId = searchParams.get('transactionTypeId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Read from location state (passed via navigate)
    const stateFilters = (location.state as { filters?: Partial<TransactionFiltersState> })
      ?.filters;

    if (categoryId || transactionTypeId || dateFrom || dateTo || stateFilters) {
      setFilters({
        dateFrom: dateFrom || stateFilters?.dateFrom || '',
        dateTo: dateTo || stateFilters?.dateTo || '',
        accountIds: stateFilters?.accountIds || [],
        categoryIds: categoryId ? [categoryId] : stateFilters?.categoryIds || [],
        transactionTypeId: transactionTypeId || stateFilters?.transactionTypeId || '',
        searchText: stateFilters?.searchText || '',
        group: stateFilters?.group || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Filter transactions based on filter state
  const filteredTransactions = useMemo(() => {
    if (!transactions || !transactionTypes) return [];
    return transactionService.filterTransactions(transactions, filters, transactionTypes);
    // transactionService is stable from context, no need to include
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, filters, transactionTypes]);

  return {
    filters,
    setFilters,
    filteredTransactions,
  };
}
