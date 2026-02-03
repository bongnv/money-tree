import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/contexts/StoreContext';
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
 * @returns Comparison data, loading state, and error
 */
export function useComparisonData(
  reportDate: string,
  comparisonType: ComparisonType,
  conversionCurrency: CurrencyCode
) {
  const { accounts, assets, transactions, exchangeRatesMap } = useStore();
  const reportService = useReportService();

  const [data, setData] = useState<ComparisonData | null>(null);

  // Create stable key for transactions
  const transactionsKey = useMemo(
    () =>
      transactions
        ?.map((t: { id: string }) => t.id)
        .sort()
        .join(',') || '',
    [transactions]
  );

  useEffect(() => {
    if (!accounts || !assets || !transactions || !exchangeRatesMap) {
      return;
    }

    let cancelled = false;

    const compute = () => {
      try {
        const result =
          comparisonType === 'month'
            ? reportService.calculateMonthOverMonthComparison(
                accounts,
                assets,
                transactions,
                reportDate,
                conversionCurrency,
                exchangeRatesMap
              )
            : reportService.calculateYearOverYearComparison(
                accounts,
                assets,
                transactions,
                reportDate,
                conversionCurrency,
                exchangeRatesMap
              );

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        console.error('[useComparisonData] Computation failed:', err);
      }
    };

    compute();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    transactionsKey,
    reportDate,
    comparisonType,
    conversionCurrency,
    reportService,
    exchangeRatesMap,
  ]);

  return { data };
}
