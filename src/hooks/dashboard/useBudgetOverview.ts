import { useMemo } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useServiceContext } from '@/contexts/ServiceContext';
import { Group } from '@/types/enums';
import type { CurrencyCode } from '@/types/enums';
import type { PeriodOption } from '@/components/common/PeriodSelector';

export interface BudgetWithUsage {
  id: string;
  name: string;
  spent: number;
  budget: number;
  percentage: number;
  isIncome: boolean;
}

/**
 * Hook for budget overview on dashboard
 * Calculates top 5 budgets with usage for the selected period
 */
export function useBudgetOverview(period: PeriodOption, baseCurrency: CurrencyCode) {
  const { budgets, transactions, transactionTypes, accounts, exchangeRatesMap, isStoreLoaded } =
    useStore();
  const { calculationService } = useServiceContext();

  // Calculate budget usage for the selected period
  const budgetsWithUsage = useMemo(() => {
    if (!budgets || !transactions || !transactionTypes || !accounts || !exchangeRatesMap) return [];

    const results: BudgetWithUsage[] = [];

    for (const budget of budgets) {
      // Get active budget for this period
      const activeBudget = calculationService.getActiveBudgetForPeriod(
        budgets.filter((b) => b.transactionTypeId === budget.transactionTypeId),
        budget.transactionTypeId,
        period.startDate
      );

      if (!activeBudget || activeBudget.id !== budget.id) {
        continue;
      }

      // Prorate budget amount for the selected period
      const proratedAmount = calculationService.prorateBudgetForPeriod(
        budget,
        period.startDate,
        period.endDate
      );

      // Convert budget to base currency if needed
      const convertedBudget = calculationService.convertBudgetAmount(
        { ...budget, amount: proratedAmount },
        period.startDate.slice(0, 7),
        baseCurrency,
        exchangeRatesMap
      );

      // Calculate actual spending/income with currency conversion
      const relevantTransactions = transactions.filter(
        (t) =>
          t.transactionTypeId === budget.transactionTypeId &&
          t.date >= period.startDate &&
          t.date <= period.endDate
      );

      const actualAmount = calculationService.sumTransactionAmounts(
        relevantTransactions,
        accounts,
        baseCurrency,
        exchangeRatesMap
      );

      // Get transaction type info
      const transactionType = transactionTypes.find((t) => t.id === budget.transactionTypeId);

      const isIncome = transactionType?.group === Group.INCOME;
      const percentage = convertedBudget === 0 ? 0 : (actualAmount / convertedBudget) * 100;

      results.push({
        id: budget.id,
        name: transactionType?.name || 'Unknown',
        spent: actualAmount,
        budget: convertedBudget,
        percentage,
        isIncome,
      });
    }

    // Sort and take top 5
    return results.sort((a, b) => b.percentage - a.percentage).slice(0, 5);
  }, [
    budgets,
    transactions,
    transactionTypes,
    accounts,
    period.startDate,
    period.endDate,
    baseCurrency,
    calculationService,
    exchangeRatesMap,
  ]);

  return {
    budgets: budgetsWithUsage,
    isLoading: !isStoreLoaded,
  };
}
