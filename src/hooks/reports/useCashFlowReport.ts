import { useState, useEffect, useMemo } from 'react';
import { useAccounts, useTransactions, useTransactionTypes, useCategories } from '../index';
import { useFilterState } from '../primitives/useFilterState';
import { useReportService } from '../useServices';
import { useBaseCurrency } from '../useSyncMetadata';
import { useEnsureExchangeRates } from '../useExchangeRates';
import { getTodayDate, getCurrentMonth } from '@/utils/date.utils';
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
  const today = getTodayDate();
  const firstDayOfMonth = getCurrentMonth() + '-01';
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(today);
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCode>(defaultCurrency);

  // Cash flow state
  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null);
  const [isLoadingCashFlow, setIsLoadingCashFlow] = useState(true);
  const [cashFlowError, setCashFlowError] = useState<Error | null>(null);

  // Trend state
  const [cashFlowTrend, setCashFlowTrend] = useState<CashFlowTrendPoint[] | null>(null);
  const [isLoadingTrend, setIsLoadingTrend] = useState(true);
  const [trendError, setTrendError] = useState<Error | null>(null);

  // Filters
  const filterState = useFilterState<CashFlowFilters>({
    categoryIds: [],
    accountIds: [],
    searchText: '',
  });

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => allTransactions?.filter((transaction) => {
    // Filter by account
    if (filterState.filters.accountIds.length > 0) {
      const matchesFrom =
        transaction.fromAccountId &&
        filterState.filters.accountIds.includes(transaction.fromAccountId);
      const matchesTo =
        transaction.toAccountId && filterState.filters.accountIds.includes(transaction.toAccountId);
      if (!matchesFrom && !matchesTo) {
        return false;
      }
    }

    // Filter by category (via transaction type)
    if (filterState.filters.categoryIds.length > 0) {
      const transactionType = transactionTypes?.find(
        (tt) => tt.id === transaction.transactionTypeId
      );
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
  }) ?? [], [allTransactions, filterState.filters, transactionTypes]);

  // Create stable key for filtered transactions
  const filteredTransactionsKey = useMemo(
    () => filteredTransactions.map(t => t.id).sort().join(','),
    [filteredTransactions]
  );

  // Calculate months for rate loading (combine both cash flow and trend needs)
  const months = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      // Fallback to date range if no transactions
      const monthsSet = new Set<string>();
      monthsSet.add(startDate.substring(0, 7));
      monthsSet.add(endDate.substring(0, 7));
      return Array.from(monthsSet);
    }
    
    // Extract unique months from actual transactions
    const monthsSet = new Set<string>();
    filteredTransactions.forEach(tx => {
      monthsSet.add(tx.date.substring(0, 7));
    });
    return Array.from(monthsSet);
  }, [filteredTransactions, startDate, endDate]);

  // Gather currencies
  const currencies = useMemo(() => {
    const set = new Set<CurrencyCode>();
    accounts?.forEach(acc => set.add(acc.currencyCode));
    set.add(conversionCurrency);
    return set;
  }, [accounts, conversionCurrency]);

  // Pre-load exchange rates
  const { ratesMap, isLoading: ratesLoading, error: ratesError } = useEnsureExchangeRates(currencies, months, conversionCurrency);

  // Cash flow computation
  useEffect(() => {
    if (!transactionTypes || !categories || !accounts || ratesLoading || !ratesMap) {
      setIsLoadingCashFlow(true);
      return;
    }

    if (ratesError) {
      setCashFlowError(ratesError);
      setIsLoadingCashFlow(false);
      return;
    }

    let cancelled = false;

    const compute = () => {
      setIsLoadingCashFlow(true);
      setCashFlowError(null);

      try {
        const result = reportService.calculateCashFlow(
          filteredTransactions,
          transactionTypes,
          categories,
          startDate,
          endDate,
          accounts,
          conversionCurrency,
          ratesMap
        );

        if (!cancelled) {
          setCashFlow(result);
          setIsLoadingCashFlow(false);
        }
      } catch (err) {
        if (!cancelled) {
          setCashFlowError(err instanceof Error ? err : new Error(String(err)));
          setIsLoadingCashFlow(false);
        }
      }
    };

    compute();

    return () => {
      cancelled = true;
    };
  }, [
    filteredTransactionsKey,
    startDate,
    endDate,
    conversionCurrency,
    reportService,
    ratesMap,
    ratesLoading,
    transactionTypes,
    categories,
    accounts,
    ratesError,
  ]);

  // Cash flow trend computation
  useEffect(() => {
    if (!transactionTypes || !categories || !accounts || ratesLoading || !ratesMap) {
      setIsLoadingTrend(true);
      return;
    }

    if (ratesError) {
      setTrendError(ratesError);
      setIsLoadingTrend(false);
      return;
    }

    let cancelled = false;

    const compute = () => {
      setIsLoadingTrend(true);
      setTrendError(null);

      try {
        const result = reportService.calculateCashFlowTrend(
          filteredTransactions,
          transactionTypes,
          categories,
          startDate,
          endDate,
          30, // 30-day intervals
          accounts,
          conversionCurrency,
          ratesMap
        );

        if (!cancelled) {
          setCashFlowTrend(result);
          setIsLoadingTrend(false);
        }
      } catch (err) {
        if (!cancelled) {
          setTrendError(err instanceof Error ? err : new Error(String(err)));
          setIsLoadingTrend(false);
        }
      }
    };

    compute();

    return () => {
      cancelled = true;
    };
  }, [
    filteredTransactionsKey,
    startDate,
    endDate,
    conversionCurrency,
    reportService,
    ratesMap,
    ratesLoading,
    transactionTypes,
    categories,
    accounts,
    ratesError,
  ]);

  return {
    // Cash flow data
    cashFlow,
    isLoadingCashFlow,
    cashFlowError,

    // Trend data
    cashFlowTrend,
    isLoadingTrend,
    trendError,

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
