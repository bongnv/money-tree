import { useState, useEffect, useMemo } from 'react';
import {
  useActiveAccounts,
  useTransactions,
  useAssets,
  useBudgets,
  useCategories,
  useTransactionTypes,
} from '../index';
import { useCalculationService, useReportService } from '../useServices';
import { useBaseCurrency } from '../useSyncMetadata';
import { useEnsureExchangeRates } from '../useExchangeRates';
import { getCurrentMonth } from '@/utils/date.utils';
import type { PeriodOption } from '@/components/common/PeriodSelector';
import type { CurrencyCode } from '@/types/enums';

export interface FinancialSummaryData {
  netWorth: number;
  cashFlow: number;
  savingsRate: number;
  budgetHealth: number;
  error: string | null;
  isLoading: boolean;
}

/**
 * Hook for dashboard financial summary
 * Calculates net worth, cash flow, savings rate, and budget health
 */
export function useFinancialSummary(period: PeriodOption): FinancialSummaryData {
  const accounts = useActiveAccounts();
  const transactions = useTransactions();
  const manualAssets = useAssets();
  const budgets = useBudgets();
  const categories = useCategories();
  const transactionTypes = useTransactionTypes();
  const baseCurrency = useBaseCurrency();
  const calculationService = useCalculationService();
  const reportService = useReportService();

  const [netWorth, setNetWorth] = useState<number>(0);
  const [cashFlow, setCashFlow] = useState<number>(0);
  const [savingsRate, setSavingsRate] = useState<number>(0);
  const [budgetHealth, setBudgetHealth] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Get current month in YYYY-MM format (local timezone)
  const currentMonth = getCurrentMonth();

  // Calculate months for rate loading from actual transactions
  const months = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentMonth); // For net worth

    if (transactions && transactions.length > 0) {
      // Extract unique months from actual transactions within period
      transactions.forEach((tx) => {
        if (tx.date >= period.startDate && tx.date <= period.endDate) {
          monthsSet.add(tx.date.substring(0, 7));
        }
      });
    }

    // Ensure period months are included even if no transactions
    monthsSet.add(period.startDate.substring(0, 7));
    monthsSet.add(period.endDate.substring(0, 7));

    return Array.from(monthsSet);
  }, [currentMonth, period, transactions]);

  // Gather currencies
  const currencies = useMemo(() => {
    const set = new Set<CurrencyCode>();
    accounts?.forEach((acc) => set.add(acc.currencyCode));
    manualAssets?.forEach((asset) => set.add(asset.currencyCode));
    budgets?.forEach((budget) => set.add(budget.currencyCode));
    set.add(baseCurrency);
    return set;
  }, [accounts, manualAssets, budgets, baseCurrency]);

  // Pre-load exchange rates
  const { ratesMap, isLoading: ratesLoading, error: ratesError } = useEnsureExchangeRates(
    currencies,
    months,
    baseCurrency
  );

  // Calculate net worth with currency conversion
  useEffect(() => {
    if (!accounts || !transactions || !manualAssets || ratesLoading || !ratesMap) return;

    if (ratesError) {
      setError(ratesError.message);
      return;
    }

    try {
      const worth = calculationService.calculateNetWorth(
        accounts,
        transactions,
        manualAssets,
        baseCurrency,
        currentMonth,
        ratesMap
      );
      setNetWorth(worth);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      setNetWorth(0);
    }
  }, [
    accounts,
    transactions,
    manualAssets,
    baseCurrency,
    currentMonth,
    calculationService,
    ratesMap,
    ratesLoading,
    ratesError,
  ]);

  // Calculate cash flow and budget performance
  useEffect(() => {
    if (
      !transactions ||
      !transactionTypes ||
      !categories ||
      !accounts ||
      !budgets ||
      ratesLoading ||
      !ratesMap
    )
      return;

    try {
      const periodTransactions = transactions.filter(
        (t) => t.date >= period.startDate && t.date <= period.endDate
      );

      const cashFlowData = reportService.calculateCashFlow(
        periodTransactions,
        transactionTypes,
        categories,
        period.startDate,
        period.endDate,
        accounts,
        baseCurrency,
        ratesMap
      );

      setCashFlow(cashFlowData.netCashFlow);

      const rate = calculationService.calculateSavingsRate(
        cashFlowData.totalIncome,
        cashFlowData.totalExpenses
      );
      setSavingsRate(rate);

      const budgetPerformance = reportService.calculateBudgetPerformance(
        budgets,
        periodTransactions,
        transactionTypes,
        categories,
        period.startDate,
        period.endDate,
        accounts,
        baseCurrency,
        ratesMap
      );

      setBudgetHealth(budgetPerformance.overallHealthScore);
    } catch (err) {
      // Handle errors silently for now
      console.error('Error calculating metrics:', err);
    }
  }, [
    transactions,
    period,
    transactionTypes,
    categories,
    accounts,
    baseCurrency,
    budgets,
    calculationService,
    reportService,
    ratesMap,
    ratesLoading,
  ]);

  const isLoading =
    ratesLoading ||
    !accounts ||
    !transactions ||
    !manualAssets ||
    !budgets ||
    !categories ||
    !transactionTypes;

  return {
    netWorth,
    cashFlow,
    savingsRate,
    budgetHealth,
    error,
    isLoading,
  };
}
