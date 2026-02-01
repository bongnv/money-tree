import { useState, useMemo, useEffect } from 'react';
import { useAccounts, useTransactions, useTransactionTypes, useCategories } from '../index';
import { useFilterState } from '../primitives/useFilterState';
import { useReportService, useCalculationService } from '../useServices';
import { useBaseCurrency } from '../useSyncMetadata';
import { useExchangeRates } from '../useExchangeRates';
import { getTodayDate } from '@/utils/date.utils';
import type { CashFlowData, CashFlowTrendPoint } from '@/services/report.service';
import { CurrencyCode } from '@/types/enums';
import type { CurrencyCode as CurrencyCodeType } from '@/types/enums';

interface CashFlowFilters {
  categoryIds: string[];
  accountIds: string[];
  searchText: string;
}

interface ChartData {
  incomePieData: { name: string; value: number }[];
  expensesPieData: { name: string; value: number }[];
  incomeDetailData: Array<{
    isTransactionType: boolean;
    categoryId: string;
    categoryName: string;
    total: number;
    transactionCount: number;
  }>;
  expenseDetailData: Array<{
    isTransactionType: boolean;
    categoryId: string;
    categoryName: string;
    total: number;
    transactionCount: number;
  }>;
  groupingLabel: string;
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
  const calculationService = useCalculationService();
  const defaultCurrency = useBaseCurrency();

  // Report parameters
  const today = getTodayDate();
  const yearToDate = (() => {
    const date = new Date();
    return `${date.getFullYear()}-01-01`;
  })();
  const [startDate, setStartDate] = useState<string>(yearToDate);
  const [endDate, setEndDate] = useState<string>(today);
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCodeType | undefined>(
    undefined
  );

  // Set conversion currency to base currency when it loads
  useEffect(() => {
    if (defaultCurrency && conversionCurrency === undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConversionCurrency(defaultCurrency);
    }
  }, [defaultCurrency, conversionCurrency]);

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
  const filteredTransactions = useMemo(
    () =>
      allTransactions?.filter((transaction) => {
        // Filter by account
        if (filterState.filters.accountIds.length > 0) {
          const matchesFrom =
            transaction.fromAccountId &&
            filterState.filters.accountIds.includes(transaction.fromAccountId);
          const matchesTo =
            transaction.toAccountId &&
            filterState.filters.accountIds.includes(transaction.toAccountId);
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
      }) ?? [],
    [allTransactions, filterState.filters, transactionTypes]
  );

  // Get exchange rates map
  const ratesMap = useExchangeRates();

  // Cash flow computation
  useEffect(() => {
    if (!transactionTypes || !categories || !accounts || !ratesMap || !conversionCurrency) {
      return;
    }

    let cancelled = false;

    const compute = () => {
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
    filteredTransactions,
    startDate,
    endDate,
    conversionCurrency,
    reportService,
    ratesMap,
    transactionTypes,
    categories,
    accounts,
  ]);

  // Cash flow trend computation
  useEffect(() => {
    if (!transactionTypes || !categories || !accounts || !ratesMap || !conversionCurrency) {
      return;
    }

    let cancelled = false;

    const compute = () => {
      setIsLoadingTrend(true);
      setTrendError(null);

      try {
        // Calculate dynamic interval based on date range
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        let interval: number;
        if (daysDiff <= 7) {
          interval = 1; // Daily for week or less
        } else if (daysDiff <= 60) {
          interval = 7; // Weekly for up to 2 months
        } else if (daysDiff <= 180) {
          interval = 14; // Bi-weekly for up to 6 months
        } else if (daysDiff <= 365) {
          interval = 30; // Monthly for up to 1 year
        } else {
          interval = 90; // Quarterly for over 1 year
        }

        const result = reportService.calculateCashFlowTrend(
          filteredTransactions,
          transactionTypes,
          categories,
          startDate,
          endDate,
          interval,
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
    filteredTransactions,
    startDate,
    endDate,
    conversionCurrency,
    reportService,
    ratesMap,
    transactionTypes,
    categories,
    accounts,
  ]);

  // Chart data for filtered views
  const chartData = useMemo<ChartData | null>(() => {
    const hasFilter = filterState.filters.categoryIds.length > 0;

    // No filter - use category grouping from cashFlow
    if (!hasFilter || !cashFlow) {
      if (!cashFlow) return null;
      return {
        incomePieData: cashFlow.income.map((cat) => ({
          name: cat.categoryName,
          value: cat.total,
        })),
        expensesPieData: cashFlow.expenses.map((cat) => ({
          name: cat.categoryName,
          value: cat.total,
        })),
        incomeDetailData: cashFlow.income.map((cat) => ({ ...cat, isTransactionType: false })),
        expenseDetailData: cashFlow.expenses.map((cat) => ({ ...cat, isTransactionType: false })),
        groupingLabel: 'Category',
      };
    }

    // Filtered - use transaction type grouping
    if (!transactionTypes || !accounts || !ratesMap || !conversionCurrency) {
      return null;
    }

    const { incomeByType, expenseByType } = calculationService.calculateTransactionTypeGrouping(
      filteredTransactions,
      transactionTypes,
      accounts,
      conversionCurrency,
      ratesMap
    );

    return {
      incomePieData: Array.from(incomeByType.values()).map((item) => ({
        name: item.name,
        value: item.total,
      })),
      expensesPieData: Array.from(expenseByType.values()).map((item) => ({
        name: item.name,
        value: item.total,
      })),
      incomeDetailData: Array.from(incomeByType.entries()).map(([id, item]) => ({
        categoryId: id,
        categoryName: item.name,
        total: item.total,
        transactionCount: item.count,
        isTransactionType: true,
      })),
      expenseDetailData: Array.from(expenseByType.entries()).map(([id, item]) => ({
        categoryId: id,
        categoryName: item.name,
        total: item.total,
        transactionCount: item.count,
        isTransactionType: true,
      })),
      groupingLabel: 'Transaction Type',
    };
  }, [
    cashFlow,
    filterState.filters.categoryIds,
    filteredTransactions,
    transactionTypes,
    accounts,
    ratesMap,
    conversionCurrency,
    calculationService,
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

    // Chart data for pie charts and tables
    chartData,

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
    conversionCurrency: conversionCurrency ?? CurrencyCode.USD,
    setConversionCurrency,
  };
}
