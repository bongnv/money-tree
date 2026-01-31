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

  // Calculate months for rate loading from actual transactions
  const months = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      // Fallback to date range if no transactions
      const monthsSet = new Set<string>();
      monthsSet.add(startDate.substring(0, 7));
      monthsSet.add(endDate.substring(0, 7));
      return Array.from(monthsSet);
    }
    
    // Extract unique months from actual transactions
    const monthsSet = new Set<string>();
    transactions.forEach(tx => {
      monthsSet.add(tx.date.substring(0, 7));
    });
    return Array.from(monthsSet);
  }, [transactions, startDate, endDate]);

  // Gather currencies
  const currencies = useMemo(() => {
    const set = new Set<CurrencyCode>();
    accounts?.forEach(acc => set.add(acc.currencyCode));
    budgets?.forEach(budget => set.add(budget.currencyCode));
    set.add(conversionCurrency);
    return set;
  }, [accounts, budgets, conversionCurrency]);

  // Pre-load exchange rates
  const { ratesMap, isLoading: ratesLoading, error: ratesError } = useEnsureExchangeRates(currencies, months, conversionCurrency);

  // Create stable key for transactions
  const transactionsKey = useMemo(
    () => transactions?.map(t => t.id).sort().join(',') || '',
    [transactions]
  );

  // Budget performance computation
  useEffect(() => {

    if (ratesError) {
      setPerformanceError(ratesError);
      setIsLoadingPerformance(false);
      return;
    }

    let cancelled = false;

    const compute = () => {
      setIsLoadingPerformance(true);
      setPerformanceError(null);

      try {
        // TypeScript narrowing: we know these are defined
        if (!budgets || !transactions || !transactionTypes || !categories || !accounts || !ratesMap) return;

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
    transactionsKey,
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
