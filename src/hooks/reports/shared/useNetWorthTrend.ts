import { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useReportService } from '../../useServices';
import { useExchangeRates } from '../../useExchangeRates';
import type { NetWorthTrendPoint } from '@/services/report.service';
import type { CurrencyCode } from '@/types/enums';

/**
 * Shared report hook for net worth trend calculation
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param interval - Days between data points (default: 30)
 * @param conversionCurrency - Currency for reporting
 * @returns Net worth trend data, loading state, and error
 */
export function useNetWorthTrend(
  startDate: string,
  endDate: string,
  interval: number = 30,
  conversionCurrency: CurrencyCode
) {
  const { accounts, assets: manualAssets, transactions } = useStore();
  const reportService = useReportService();

  // Get exchange rates map
  const ratesMap = useExchangeRates();

  const [data, setData] = useState<NetWorthTrendPoint[] | null>(null);

  useEffect(() => {
    if (!accounts || !manualAssets || !transactions || !ratesMap) {
      return;
    }

    let cancelled = false;

    const compute = () => {
      try {
        const result = reportService.calculateNetWorthTrend(
          accounts,
          manualAssets,
          transactions,
          startDate,
          endDate,
          interval, // Use the interval parameter, not hardcoded 30
          conversionCurrency,
          ratesMap
        );

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        console.error('[useNetWorthTrend] Computation failed:', err);
      }
    };

    compute();

    return () => {
      cancelled = true;
    };
  }, [
    accounts,
    manualAssets,
    transactions,
    startDate,
    endDate,
    interval,
    conversionCurrency,
    reportService,
    ratesMap,
  ]);

  return { data };
}
