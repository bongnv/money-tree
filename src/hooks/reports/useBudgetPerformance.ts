import { useState } from 'react';
import {
  useBudgets,
  useTransactions,
  useTransactionTypes,
  useCategories,
  useAccounts,
} from '../index';
import { useAsyncComputation } from '../primitives/useAsyncComputation';
import { useReportService } from '../useServices';
import { useBaseCurrency } from '../useSyncMetadata';
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
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(today);
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCode>(defaultCurrency);

  // Budget performance computation
  const {
    data: budgetPerformance,
    status: performanceStatus,
    error: performanceError,
    refresh: refreshPerformance,
  } = useAsyncComputation<BudgetPerformanceData>(
    async () => {
      return await reportService.calculateBudgetPerformance(
        budgets,
        transactions,
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

  return {
    // Performance data
    budgetPerformance,
    isLoadingPerformance: performanceStatus === 'loading',
    performanceError,
    refreshPerformance,

    // Parameters
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    conversionCurrency,
    setConversionCurrency,
  };
}
