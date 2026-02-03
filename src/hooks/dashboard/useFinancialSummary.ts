import { useMemo } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useCalculationService, useReportService } from '../useServices';
import { getCurrentMonth } from '@/utils/date.utils';
import type { PeriodOption } from '@/components/common/PeriodSelector';

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
  const {
    accounts,
    transactions,
    assets,
    budgets,
    categories,
    transactionTypes,
    baseCurrency,
    exchangeRatesMap,
    isStoreLoaded,
  } = useStore();
  const calculationService = useCalculationService();
  const reportService = useReportService();

  // Get current month in YYYY-MM format (local timezone)
  const currentMonth = getCurrentMonth();

  // Calculate net worth with currency conversion using useMemo
  const netWorthResult = useMemo(() => {
    if (!accounts || !transactions || !assets || !exchangeRatesMap) {
      return { value: 0, error: null };
    }

    try {
      const worth = calculationService.calculateNetWorth(
        accounts,
        transactions,
        assets,
        baseCurrency,
        currentMonth,
        exchangeRatesMap
      );
      return { value: worth, error: null };
    } catch (err) {
      return {
        value: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }, [
    accounts,
    transactions,
    assets,
    baseCurrency,
    currentMonth,
    calculationService,
    exchangeRatesMap,
  ]);

  const netWorth = netWorthResult.value;
  const error = netWorthResult.error;

  // Calculate cash flow and budget performance using useMemo
  const { cashFlow, savingsRate, budgetHealth } = useMemo(() => {
    if (!isStoreLoaded) {
      return { cashFlow: 0, savingsRate: 0, budgetHealth: 0 };
    }

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
        exchangeRatesMap
      );

      const rate = calculationService.calculateSavingsRate(
        cashFlowData.totalIncome,
        cashFlowData.totalExpenses
      );

      const budgetPerformance = reportService.calculateBudgetPerformance(
        budgets,
        periodTransactions,
        transactionTypes,
        categories,
        period.startDate,
        period.endDate,
        accounts,
        baseCurrency,
        exchangeRatesMap
      );

      return {
        cashFlow: cashFlowData.netCashFlow,
        savingsRate: rate,
        budgetHealth: budgetPerformance.overallHealthScore,
      };
    } catch (err) {
      console.error('Error calculating metrics:', err);
      return { cashFlow: 0, savingsRate: 0, budgetHealth: 0 };
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
    exchangeRatesMap,
    isStoreLoaded,
  ]);

  return {
    netWorth,
    cashFlow,
    savingsRate,
    budgetHealth,
    error,
    isLoading: !isStoreLoaded,
  };
}
