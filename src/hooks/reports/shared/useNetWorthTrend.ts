import { useState, useEffect, useMemo } from 'react';
import { useAccounts, useAssets, useTransactions } from '../../index';
import { useReportService } from '../../useServices';
import { useEnsureExchangeRates } from '../../useExchangeRates';
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
  const accounts = useAccounts();
  const manualAssets = useAssets();
  const transactions = useTransactions();
  const reportService = useReportService();

  // Calculate months for rate loading - need ALL months in the trend period, not just transaction months
  const months = useMemo(() => {
    const monthsSet = new Set<string>();
    
    // Parse start and end dates
    const [startYear, startMonth] = startDate.split('-').map(Number);
    const [endYear, endMonth] = endDate.split('-').map(Number);
    
    // Generate all months in the date range
    let currentYear = startYear;
    let currentMonth = startMonth;
    
    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      monthsSet.add(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
      
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
    
    return Array.from(monthsSet);
  }, [startDate, endDate]);

  // Gather currencies
  const currencies = useMemo(() => {
    const set = new Set<CurrencyCode>();
    accounts?.forEach(acc => set.add(acc.currencyCode));
    manualAssets?.forEach(asset => set.add(asset.currencyCode));
    set.add(conversionCurrency);
    return set;
  }, [accounts, manualAssets, conversionCurrency]);

  // Pre-load exchange rates
  const { ratesMap, isLoading: ratesLoading, error: ratesError } = useEnsureExchangeRates(currencies, months, conversionCurrency);

  const [data, setData] = useState<NetWorthTrendPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {

    if (ratesError) {
      setError(ratesError);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const compute = () => {
      setIsLoading(true);
      setError(null);

      try {
        // TypeScript narrowing: we know these are defined from the checks above
        if (!accounts || !manualAssets || !transactions || !ratesMap) return;

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
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[useNetWorthTrend] Computation failed:', err);
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
  }, [accounts, manualAssets, transactions, startDate, endDate, interval, conversionCurrency, reportService, ratesMap, ratesLoading, ratesError]);

  return { data, isLoading, error };
}
