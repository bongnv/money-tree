import { useMemo, useCallback } from 'react';
import {
  useBudgets,
  useTransactions,
  useTransactionTypes,
  useCategories,
  useAccounts,
} from '../index';
import { useCalculationService } from '../useServices';
import { useBaseCurrency } from '../useSyncMetadata';
import { useEnsureExchangeRates } from '../useExchangeRates';
import type { Budget } from '@/types/models';
import type { CurrencyCode } from '@/types/enums';

export interface BudgetGroupingItem {
  budget: Budget;
  transactionType: { id: string; name: string; group: string };
  proratedBudget: number;
  actualAmount: number;
  percentage: number;
}

export interface BudgetGroupingCategory {
  category: { id: string; name: string };
  items: BudgetGroupingItem[];
  totalBudget: number;
  totalActual: number;
}

export type BudgetGroupingData = Record<string, BudgetGroupingCategory>;

/**
 * Hook for grouped budget calculation with category filtering
 * Used in BudgetsPage
 */
export function useBudgetGrouping(
  selectedPeriod: { startDate: string; endDate: string },
  selectedCategories: string[]
) {
  const budgets = useBudgets();
  const transactions = useTransactions();
  const transactionTypes = useTransactionTypes();
  const categories = useCategories();
  const accounts = useAccounts();
  const baseCurrency = useBaseCurrency();
  const calculationService = useCalculationService();

  // Helper to get category by id - memoized to prevent infinite loops
  const getCategoryById = useCallback(
    (id: string) => categories?.find((c) => c.id === id),
    [categories]
  );

  // Calculate months for rate loading from actual transactions
  const months = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      // Fallback to period months if no transactions
      const monthsSet = new Set<string>();
      monthsSet.add(selectedPeriod.startDate.substring(0, 7));
      monthsSet.add(selectedPeriod.endDate.substring(0, 7));
      return Array.from(monthsSet);
    }

    // Extract unique months from actual transactions within period
    const monthsSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date >= selectedPeriod.startDate && tx.date <= selectedPeriod.endDate) {
        monthsSet.add(tx.date.substring(0, 7));
      }
    });

    // Ensure period months are included even if no transactions
    if (monthsSet.size === 0) {
      monthsSet.add(selectedPeriod.startDate.substring(0, 7));
      monthsSet.add(selectedPeriod.endDate.substring(0, 7));
    }

    return Array.from(monthsSet);
  }, [transactions, selectedPeriod]);

  // Gather currencies
  const currencies = useMemo(() => {
    const set = new Set<CurrencyCode>();
    accounts?.forEach((acc) => set.add(acc.currencyCode));
    budgets?.forEach((budget) => set.add(budget.currencyCode));
    set.add(baseCurrency);
    return set;
  }, [accounts, budgets, baseCurrency]);

  // Pre-load exchange rates
  const { ratesMap, isLoading: ratesLoading } = useEnsureExchangeRates(
    currencies,
    months,
    baseCurrency
  );

  const groupedBudgets = useMemo(() => {
    if (
      !budgets ||
      !transactionTypes ||
      !transactions ||
      !accounts ||
      !categories ||
      ratesLoading ||
      !ratesMap
    )
      return {};

    // Filter budgets that are active during the selected period
    let activeBudgets = budgets.filter((budget) => {
      // Check if budget overlaps with selected period
      return (
        budget.startDate <= selectedPeriod.endDate && budget.endDate >= selectedPeriod.startDate
      );
    });

    // Filter by selected categories if any
    if (selectedCategories.length > 0) {
      activeBudgets = activeBudgets.filter((budget) => {
        const transactionType = transactionTypes.find((tt) => tt.id === budget.transactionTypeId);
        return transactionType && selectedCategories.includes(transactionType.categoryId);
      });
    }

    return calculationService.calculateBudgetGrouping(
      activeBudgets,
      transactions,
      transactionTypes,
      accounts,
      selectedPeriod,
      baseCurrency,
      ratesMap,
      getCategoryById
    );
  }, [
    budgets,
    transactionTypes,
    transactions,
    accounts,
    categories,
    selectedPeriod,
    getCategoryById,
    selectedCategories,
    baseCurrency,
    calculationService,
    ratesMap,
    ratesLoading,
  ]);

  return {
    groupedBudgets,
    isLoading:
      ratesLoading || !budgets || !transactionTypes || !transactions || !accounts || !categories,
  };
}
