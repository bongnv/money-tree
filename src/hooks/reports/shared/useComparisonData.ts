import { useState, useEffect, useMemo } from 'react';
import { useAccounts, useAssets, useTransactions } from '../../index';
import { useReportService } from '../../useServices';
import { useExchangeRates } from '../../useExchangeRates';
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
  const accounts = useAccounts();
  const manualAssets = useAssets();
  const transactions = useTransactions();
  const reportService = useReportService();

  // Get exchange rates map
  const ratesMap = useExchangeRates();

  const [data, setData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Create stable key for transactions
  const transactionsKey = useMemo(
    () =>
      transactions
        ?.map((t) => t.id)
        .sort()
        .join(',') || '',
    [transactions]
  );

  useEffect(() => {
    if (!accounts || !manualAssets || !transactions || !ratesMap) {
      return;
    }

    let cancelled = false;

    const compute = () => {
      setIsLoading(true);
      setError(null);

      try {
        const result =
          comparisonType === 'month'
            ? reportService.calculateMonthOverMonthComparison(
                accounts,
                manualAssets,
                transactions,
                reportDate,
                conversionCurrency,
                ratesMap
              )
            : reportService.calculateYearOverYearComparison(
                accounts,
                manualAssets,
                transactions,
                reportDate,
                conversionCurrency,
                ratesMap
              );

        if (!cancelled) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    };

    compute();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionsKey, reportDate, comparisonType, conversionCurrency, reportService, ratesMap]);

  return { data, isLoading, error };
}
