import { useState, useEffect, useMemo } from 'react';
import {
  useBudgets,
  useTransactions,
  useTransactionTypes,
  useCategories,
  useAccounts,
} from '../index';
import { useReportService } from '../useServices';
import { useBaseCurrency } from '../useSyncMetadata';
import { useEnsureExchangeRates } from '../useExchangeRates';
import { getTodayDate, getCurrentMonth } from '@/utils/date.utils';
import type { BudgetPerformanceData } from '@/services/report.service';
import type { CurrencyCode } from '@/types/enums';

/**
 * Comprehensive budget performance report hook
 * Combines budget vs actual analysis with trend data
 *
 * Manages:
 * - Budget performance for a date range (budgeted vs actual)
 * - Budget performance trend over time
 * - Currency conversion
 *
 * @returns All data and controls needed for budget performance reports
 */
export function useBudgetPerformance() {
  const budgets = useBudgets();
  const transactions = useTransactions();
  const transactionTypes = useTransactionTypes();
  const categories = useCategories();
  const accounts = useAccounts();
  const reportService = useReportService();
  const defaultCurrency = useBaseCurrency();

  // Report parameters
  const today = getTodayDate();
  const firstDayOfMonth = getCurrentMonth() + '-01';
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(today);
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCode>(defaultCurrency);

  const [budgetPerformance, setBudgetPerformance] = useState<BudgetPerformanceData | null>(null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(true);
  const [performanceError, setPerformanceError] = useState<Error | null>(null);

  // Calculate months for rate loading - include report date range and transaction months
  const months = useMemo(() => {
    const monthsSet = new Set<string>();
    
    // Always include start and end month of the report
    monthsSet.add(startDate.substring(0, 7));
    monthsSet.add(endDate.substring(0, 7));

    // Add all months from transactions within or near the date range
    if (transactions && transactions.length > 0) {
      transactions.forEach((tx) => {
        monthsSet.add(tx.date.substring(0, 7));
      });
    }

    return Array.from(monthsSet);
  }, [transactions, startDate, endDate]);

  // Gather currencies
  const currencies = useMemo(() => {
    const set = new Set<CurrencyCode>();
    accounts?.forEach((acc) => {
      if (acc.currencyCode) set.add(acc.currencyCode);
    });
    budgets?.forEach((budget) => {
      if (budget.currencyCode) set.add(budget.currencyCode);
    });
    set.add(conversionCurrency);
    return set;
  }, [accounts, budgets, conversionCurrency]);

  // Pre-load exchange rates
  const {
    ratesMap,
    isLoading: ratesLoading,
    error: ratesError,
  } = useEnsureExchangeRates(currencies, months, conversionCurrency);

  // Budget performance computation
  useEffect(() => {
    if (ratesError) {
      Promise.resolve().then(() => {
        setPerformanceError(ratesError);
        setIsLoadingPerformance(false);
      });
      return;
    }

    let cancelled = false;

    const compute = () => {
      setIsLoadingPerformance(true);
      setPerformanceError(null);

      try {
        // TypeScript narrowing: we know these are defined
        if (!budgets || !transactions || !transactionTypes || !categories || !accounts || !ratesMap)
          return;

        const result = reportService.calculateBudgetPerformance(
          budgets,
          transactions,
          transactionTypes,
          categories,
          startDate,
          endDate,
          accounts,
          conversionCurrency,
          ratesMap
        );

        if (!cancelled) {
          setBudgetPerformance(result);
          setIsLoadingPerformance(false);
        }
      } catch (err) {
        console.error('[useBudgetPerformance] Error computing budget performance', err);
        if (!cancelled) {
          setPerformanceError(err instanceof Error ? err : new Error(String(err)));
          setIsLoadingPerformance(false);
        }
      }
    };

    compute();

    return () => {
      cancelled = true;
    };
  }, [
    budgets,
    transactions,
    transactionTypes,
    categories,
    accounts,
    startDate,
    endDate,
    conversionCurrency,
    reportService,
    ratesMap,
    ratesLoading,
    ratesError,
  ]);

  return {
    // Performance data
    budgetPerformance,
    isLoadingPerformance,
    performanceError,

    // Parameters
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    conversionCurrency,
    setConversionCurrency,
  };
}
