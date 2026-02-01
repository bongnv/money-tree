import { useState, useEffect } from 'react';
import {
  useBudgets,
  useTransactions,
  useTransactionTypes,
  useCategories,
  useAccounts,
} from '../index';
import { useReportService } from '../useServices';
import { useBaseCurrency } from '../useSyncMetadata';
import { useExchangeRates } from '../useExchangeRates';
import { getTodayDate, getCurrentMonth } from '@/utils/date.utils';
import type { BudgetPerformanceData } from '@/services/report.service';
import { CurrencyCode } from '@/types/enums';
import type { CurrencyCode as CurrencyCodeType } from '@/types/enums';

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

  const [budgetPerformance, setBudgetPerformance] = useState<BudgetPerformanceData | null>(null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(true);
  const [performanceError, setPerformanceError] = useState<Error | null>(null);

  // Get exchange rates map
  const ratesMap = useExchangeRates();

  // Budget performance computation
  useEffect(() => {
    if (
      !budgets ||
      !transactions ||
      !transactionTypes ||
      !categories ||
      !accounts ||
      !ratesMap ||
      !conversionCurrency
    ) {
      // isLoadingPerformance is already true from initial state
      return;
    }

    let cancelled = false;

    const compute = () => {
      setIsLoadingPerformance(true);
      setPerformanceError(null);

      try {
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
    conversionCurrency: conversionCurrency ?? CurrencyCode.USD,
    setConversionCurrency,
  };
}
