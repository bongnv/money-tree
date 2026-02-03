import { useMemo, useCallback } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useCalculationService } from '../useServices';
import type { CurrencyCode } from '@/types/enums';
import type { Budget } from '@/types/models';

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
  selectedCategories: string[],
  baseCurrency: CurrencyCode
) {
  const { budgets, transactions, transactionTypes, categories, accounts, exchangeRatesMap } =
    useStore();
  const calculationService = useCalculationService();

  // Helper to get category by id - memoized to prevent infinite loops
  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories]
  );

  const groupedBudgets = useMemo(() => {
    if (!exchangeRatesMap) return {};

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
      exchangeRatesMap,
      getCategoryById
    );
  }, [
    budgets,
    transactionTypes,
    transactions,
    accounts,
    selectedPeriod,
    getCategoryById,
    selectedCategories,
    baseCurrency,
    calculationService,
    exchangeRatesMap,
  ]);

  return {
    groupedBudgets,
    isLoading: !exchangeRatesMap,
  };
}
