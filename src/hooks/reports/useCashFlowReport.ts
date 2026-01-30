import { useState } from 'react';
import {
  useAccounts,
  useTransactions,
  useTransactionTypes,
  useCategories,
} from '../index';
import { useAsyncComputation } from '../primitives/useAsyncComputation';
import { useFilterState } from '../primitives/useFilterState';
import { useReportService } from '../useServices';
import { useBaseCurrency } from '../useSyncMetadata';
import type { CashFlowData, CashFlowTrendPoint } from '@/services/report.service';
import type { CurrencyCode } from '@/types/enums';

interface CashFlowFilters {
  categoryIds: string[];
  accountIds: string[];
  searchText: string;
}

/**
 * Comprehensive cash flow report hook with filtering
 * Combines cash flow calculation, trend analysis, and advanced filtering
 * 
 * Manages:
 * - Cash flow calculation for a date range
 * - Cash flow trend over time
 * - Filters by category, account, and search text
 * - Currency conversion
 * 
 * @returns All data and controls needed for cash flow reports
 */
export function useCashFlowReport() {
  const accounts = useAccounts();
  const allTransactions = useTransactions();
  const transactionTypes = useTransactionTypes();
  const categories = useCategories();
  const reportService = useReportService();
  const defaultCurrency = useBaseCurrency();

  // Report parameters
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(today);
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCode>(defaultCurrency);

  // Filters
  const filterState = useFilterState<CashFlowFilters>({
    categoryIds: [],
    accountIds: [],
    searchText: '',
  });

  // Filter transactions based on current filters
  const filteredTransactions = allTransactions.filter((transaction) => {
    // Filter by account
    if (filterState.filters.accountIds.length > 0) {
      const matchesFrom = transaction.fromAccountId && filterState.filters.accountIds.includes(transaction.fromAccountId);
      const matchesTo = transaction.toAccountId && filterState.filters.accountIds.includes(transaction.toAccountId);
      if (!matchesFrom && !matchesTo) {
        return false;
      }
    }

    // Filter by category (via transaction type)
    if (filterState.filters.categoryIds.length > 0) {
      const transactionType = transactionTypes.find((tt) => tt.id === transaction.transactionTypeId);
      if (
        !transactionType ||
        !filterState.filters.categoryIds.includes(transactionType.categoryId)
      ) {
        return false;
      }
    }

    // Filter by search text
    if (filterState.filters.searchText) {
      const searchLower = filterState.filters.searchText.toLowerCase();
      return (
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.transactionTypeId.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Cash flow computation
  const {
    data: cashFlow,
    status: cashFlowStatus,
    error: cashFlowError,
    refresh: refreshCashFlow,
  } = useAsyncComputation<CashFlowData>(
    async () => {
      return await reportService.calculateCashFlow(
        filteredTransactions,
        transactionTypes,
        categories,
        startDate,
        endDate,
        accounts,
        conversionCurrency
      );
    },
    [],
    { immediate: true }
  );

  // Cash flow trend computation
  const {
    data: cashFlowTrend,
    status: trendStatus,
    error: trendError,
    refresh: refreshTrend,
  } = useAsyncComputation<CashFlowTrendPoint[]>(
    async () => {
      return await reportService.calculateCashFlowTrend(
        filteredTransactions,
        transactionTypes,
        categories,
        startDate,
        endDate,
        30, // 30-day intervals
        accounts,
        conversionCurrency
      );
    },
    [],
    { immediate: true }
  );

  return {
    // Cash flow data
    cashFlow,
    isLoadingCashFlow: cashFlowStatus === 'loading',
    cashFlowError,
    refreshCashFlow,

    // Trend data
    cashFlowTrend,
    isLoadingTrend: trendStatus === 'loading',
    trendError,
    refreshTrend,

    // Filters
    filters: filterState.filters,
    appliedFilters: filterState.appliedFilters,
    setFilter: filterState.setFilter,
    applyFilters: filterState.applyFilters,
    resetFilters: filterState.resetFilters,
    hasActiveFilters: filterState.hasActiveFilters,

    // Parameters
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    conversionCurrency,
    setConversionCurrency,
  };
}
