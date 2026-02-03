import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useReportService } from '../useServices';
import { getTodayDate } from '@/utils/date.utils';
import type { BudgetPerformanceData, BudgetTrendPoint } from '@/services/report.service';
import { CurrencyCode } from '@/types/enums';
import type { CurrencyCode as CurrencyCodeType } from '@/types/enums';

export interface GroupedBudgetItem {
  categoryId: string;
  categoryName: string;
  isCategory: boolean;
  transactionTypeId?: string;
  transactionTypeName?: string;
  budgetedAmount: number;
  actualAmount: number;
  remaining: number;
  percentUsed: number;
  isIncome: boolean;
}

export interface DisplayPerformance {
  items: Array<{
    categoryId: string;
    categoryName: string;
    transactionTypeId: string;
    transactionTypeName: string;
    budgetedAmount: number;
    actualAmount: number;
    remaining: number;
    percentUsed: number;
    isIncome: boolean;
  }>;
  totalBudgetedIncome: number;
  totalActualIncome: number;
  totalRemainingIncome: number;
  totalBudgetedExpenses: number;
  totalActualExpenses: number;
  totalRemainingExpenses: number;
  overallHealthScore: number;
}

/**
 * Comprehensive budget performance report hook
 * Combines budget vs actual analysis with filtering and grouping logic
 *
 * Manages:
 * - Budget performance for a date range (budgeted vs actual)
 * - Category filtering
 * - Grouping by category or transaction type
 * - Currency conversion
 *
 * @returns All data and controls needed for budget performance reports
 */
export function useBudgetPerformance() {
  const {
    budgets,
    transactions,
    transactionTypes,
    categories,
    accounts,
    baseCurrency,
    exchangeRatesMap,
  } = useStore();
  const reportService = useReportService();

  // Report parameters
  const today = getTodayDate();
  const yearStart = today.slice(0, 4) + '-01-01';
  const [startDate, setStartDate] = useState<string>(yearStart);
  const [endDate, setEndDate] = useState<string>(today);
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCodeType | undefined>(
    undefined
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Set conversion currency to base currency when it loads
  useEffect(() => {
    if (baseCurrency && conversionCurrency === undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConversionCurrency(baseCurrency);
    }
  }, [baseCurrency, conversionCurrency]);

  const [budgetPerformance, setBudgetPerformance] = useState<BudgetPerformanceData | null>(null);
  const [trendData, setTrendData] = useState<BudgetTrendPoint[]>([]);

  // Budget performance computation
  useEffect(() => {
    if (
      !budgets ||
      !transactions ||
      !transactionTypes ||
      !categories ||
      !accounts ||
      !exchangeRatesMap ||
      !conversionCurrency
    ) {
      return;
    }

    let cancelled = false;

    const compute = () => {
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
          exchangeRatesMap
        );

        // Calculate trend data
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const intervalDays = daysDiff > 180 ? 30 : daysDiff > 60 ? 7 : 1;

        const trend = reportService.calculateBudgetTrend(
          budgets,
          transactions,
          transactionTypes,
          categories,
          startDate,
          endDate,
          intervalDays,
          accounts,
          conversionCurrency,
          exchangeRatesMap
        );

        if (!cancelled) {
          setBudgetPerformance(result);
          setTrendData(trend);
        }
      } catch (err) {
        console.error('[useBudgetPerformance] Error computing budget performance', err);
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
    exchangeRatesMap,
  ]);

  // Default performance with fallback
  const performance = useMemo<DisplayPerformance>(
    () =>
      budgetPerformance || {
        items: [],
        totalBudgetedIncome: 0,
        totalActualIncome: 0,
        totalRemainingIncome: 0,
        totalBudgetedExpenses: 0,
        totalActualExpenses: 0,
        totalRemainingExpenses: 0,
        overallHealthScore: 100,
      },
    [budgetPerformance]
  );

  // Filter performance by selected categories
  const displayPerformance = useMemo<DisplayPerformance>(() => {
    if (selectedCategories.length === 0) {
      return performance;
    }

    const filteredItems = performance.items.filter((item) =>
      selectedCategories.includes(item.categoryId)
    );

    let totalBudgetedIncome = 0;
    let totalActualIncome = 0;
    let totalRemainingIncome = 0;
    let totalBudgetedExpenses = 0;
    let totalActualExpenses = 0;
    let totalRemainingExpenses = 0;

    filteredItems.forEach((item) => {
      if (item.isIncome) {
        totalBudgetedIncome += item.budgetedAmount;
        totalActualIncome += item.actualAmount;
        totalRemainingIncome += item.remaining;
      } else {
        totalBudgetedExpenses += item.budgetedAmount;
        totalActualExpenses += item.actualAmount;
        totalRemainingExpenses += item.remaining;
      }
    });

    return {
      items: filteredItems,
      totalBudgetedIncome,
      totalActualIncome,
      totalRemainingIncome,
      totalBudgetedExpenses,
      totalActualExpenses,
      totalRemainingExpenses,
      overallHealthScore: performance.overallHealthScore,
    };
  }, [performance, selectedCategories]);

  // Group items by category or transaction type
  const groupedItems = useMemo<GroupedBudgetItem[]>(() => {
    if (selectedCategories.length > 0) {
      // When filtered, show individual transaction types
      const filtered = performance.items
        .filter((item) => selectedCategories.includes(item.categoryId))
        .map((item) => ({
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          isCategory: false,
          transactionTypeId: item.transactionTypeId,
          transactionTypeName: item.transactionTypeName,
          budgetedAmount: item.budgetedAmount,
          actualAmount: item.actualAmount,
          remaining: item.remaining,
          percentUsed: item.percentUsed,
          isIncome: item.isIncome,
        }));

      return filtered;
    }

    // When no filter, aggregate by category
    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        budgetedAmount: number;
        actualAmount: number;
        isIncome: boolean;
      }
    >();

    performance.items.forEach((item) => {
      const existing = categoryMap.get(item.categoryId);
      if (existing) {
        existing.budgetedAmount += item.budgetedAmount;
        existing.actualAmount += item.actualAmount;
      } else {
        categoryMap.set(item.categoryId, {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          budgetedAmount: item.budgetedAmount,
          actualAmount: item.actualAmount,
          isIncome: item.isIncome,
        });
      }
    });

    const aggregated = Array.from(categoryMap.values()).map((cat) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      isCategory: true,
      budgetedAmount: cat.budgetedAmount,
      actualAmount: cat.actualAmount,
      remaining: cat.budgetedAmount - cat.actualAmount,
      percentUsed: cat.budgetedAmount > 0 ? (cat.actualAmount / cat.budgetedAmount) * 100 : 0,
      isIncome: cat.isIncome,
    }));

    return aggregated;
  }, [performance.items, selectedCategories]);

  // Date range setter
  const setDateRange = useCallback((newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, []);

  // Handlers
  const handleCategoryChange = useCallback((categoryIds: string[]) => {
    setSelectedCategories(categoryIds);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  const handleItemClick = useCallback(
    (itemId: string, isCategory: boolean) => {
      if (isCategory) {
        setSelectedCategories([itemId]);
      }
      return { itemId, isCategory, startDate, endDate };
    },
    [startDate, endDate]
  );

  return {
    // Performance data
    budgetPerformance,
    displayPerformance,
    groupedItems,
    trendData,

    // Parameters
    startDate,
    endDate,
    setDateRange,
    conversionCurrency: conversionCurrency ?? CurrencyCode.USD,
    setConversionCurrency,

    // Filters
    selectedCategories,
    handleCategoryChange,
    handleClearFilters,
    handleItemClick,
  };
}
