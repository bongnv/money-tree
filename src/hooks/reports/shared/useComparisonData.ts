import { useAccounts, useAssets, useTransactions } from '../../index';
import { useAsyncComputation } from '../../primitives/useAsyncComputation';
import { useReportService } from '../../useServices';
import type { BalanceSheetData } from '@/services/report.service';
import type { CurrencyCode } from '@/types/enums';

export type ComparisonType = 'month' | 'year';

export interface ComparisonData {
  current: BalanceSheetData;
  previous: BalanceSheetData;
  change: number;
  changePercent: number;
}

/**
 * Shared report hook for balance sheet comparisons
 * Supports month-over-month and year-over-year comparisons
 * 
 * @param reportDate - Date to compare (YYYY-MM-DD)
 * @param comparisonType - Type of comparison ('month' or 'year')
 * @param conversionCurrency - Currency for reporting
 * @returns Async computation result with comparison data
 */
export function useComparisonData(
  reportDate: string,
  comparisonType: ComparisonType,
  conversionCurrency: CurrencyCode
) {
  const accounts = useAccounts();
  const manualAssets = useAssets();
  const transactions = useTransactions();
  const reportService = useReportService();

  return useAsyncComputation<ComparisonData>(
    async () => {
      if (comparisonType === 'month') {
        return await reportService.calculateMonthOverMonthComparison(
          accounts,
          manualAssets,
          transactions,
          reportDate,
          conversionCurrency
        );
      } else {
        return await reportService.calculateYearOverYearComparison(
          accounts,
          manualAssets,
          transactions,
          reportDate,
          conversionCurrency
        );
      }
    },
    [],
    { immediate: true }
  );
}
