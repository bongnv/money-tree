import { useAccounts, useAssets, useTransactions } from '../../index';
import { useAsyncComputation } from '../../primitives/useAsyncComputation';
import { useReportService } from '../../useServices';
import type { NetWorthTrendPoint } from '@/services/report.service';
import type { CurrencyCode } from '@/types/enums';

/**
 * Shared report hook for net worth trend calculation
 * Wraps useAsyncComputation with reportService.calculateNetWorthTrend
 * 
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param interval - Days between data points (default: 30)
 * @param conversionCurrency - Currency for reporting
 * @returns Async computation result with net worth trend data
 */
export function useNetWorthTrend(
  startDate: string,
  endDate: string,
  interval: number = 30,
  conversionCurrency: CurrencyCode
) {
  const accounts = useAccounts();
  const manualAssets = useAssets();
  const transactions = useTransactions();
  const reportService = useReportService();

  return useAsyncComputation<NetWorthTrendPoint[]>(
    async () => {
      return await reportService.calculateNetWorthTrend(
        accounts,
        manualAssets,
        transactions,
        startDate,
        endDate,
        interval,
        conversionCurrency
      );
    },
    [],
    { immediate: true }
  );
}
