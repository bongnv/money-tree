import { useState, useMemo, useEffect } from 'react';
import { useAccounts, useAssets, useTransactions, useEnsureExchangeRates } from '../index';
import { useReportService } from '../useServices';
import { useBaseCurrency } from '../useSyncMetadata';
import { useNetWorthTrend } from './shared/useNetWorthTrend';
import { useComparisonData, type ComparisonType } from './shared/useComparisonData';
import type { BalanceSheetData } from '@/services/report.service';
import type { CurrencyCode } from '@/types/enums';
import { getTodayDate } from '@/utils/date.utils';

/**
 * Comprehensive balance sheet report hook
 * Combines balance sheet calculation, net worth trend, and comparison data
 *
 * Manages:
 * - Balance sheet as of a specific date
 * - Net worth trend over time
 * - Month-over-month or year-over-year comparisons
 * - Currency conversion
 *
 * @returns All data and controls needed for balance sheet reports
 */
export function useBalanceSheet() {
  const accounts = useAccounts();
  const manualAssets = useAssets();
  const transactions = useTransactions();
  const reportService = useReportService();
  const defaultCurrency = useBaseCurrency();

  // Report parameters
  const today = getTodayDate();
  const [reportDate, setReportDate] = useState<string>(today);
  const [comparisonType, setComparisonType] = useState<ComparisonType>('month');
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCode>(defaultCurrency);

  // Balance sheet state
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
  const [isLoadingBalanceSheet, setIsLoadingBalanceSheet] = useState(true);
  const [balanceSheetError, setBalanceSheetError] = useState<Error | null>(null);

  // Create stable dependency key for transactions
  const transactionsKey = useMemo(
    () =>
      transactions
        ?.map((t) => t.id)
        .sort()
        .join(',') || '',
    [transactions]
  );

  // Collect all currencies used
  const currencies = useMemo(() => {
    if (!accounts || !manualAssets) return undefined;

    const currencySet = new Set<CurrencyCode>();
    accounts.forEach((acc) => currencySet.add(acc.currencyCode));
    manualAssets.forEach((asset) => currencySet.add(asset.currencyCode));
    currencySet.add(conversionCurrency);

    return currencySet;
  }, [accounts, manualAssets, conversionCurrency]);

  // Get month for rate lookup
  const rateMonths = useMemo(() => [reportDate.substring(0, 7)], [reportDate]);

  // Load exchange rates and get rates map
  const {
    ratesMap,
    isLoading: isLoadingRates,
    error: ratesError,
  } = useEnsureExchangeRates(currencies, rateMonths, conversionCurrency);

  // Update error state from rates loading
  useEffect(() => {
    if (ratesError) {
      setBalanceSheetError(ratesError);
      setIsLoadingBalanceSheet(false);
    }
  }, [ratesError]);

  // Compute balance sheet with loaded rates
  useEffect(() => {
    if (!accounts || !manualAssets || !transactions || !ratesMap || isLoadingRates) {
      setIsLoadingBalanceSheet(true);
      return;
    }

    let cancelled = false;

    const compute = async () => {
      setIsLoadingBalanceSheet(true);

      try {
        const result = await reportService.calculateBalanceSheet(
          accounts,
          manualAssets,
          transactions,
          reportDate,
          conversionCurrency,
          ratesMap
        );

        if (!cancelled) {
          setBalanceSheet(result);
          setIsLoadingBalanceSheet(false);
          setBalanceSheetError(null);
        }
      } catch (err) {
        console.error('[useBalanceSheet] Computation failed', err);
        if (!cancelled) {
          setBalanceSheetError(err instanceof Error ? err : new Error(String(err)));
          setIsLoadingBalanceSheet(false);
        }
      }
    };

    compute();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionsKey, reportDate, conversionCurrency, ratesMap, isLoadingRates, reportService]);

  // Net worth trend (last 12 months)
  const trendStartDate = useMemo(() => {
    // Calculate one year ago from today
    const today = getTodayDate();
    const [year, month, day] = today.split('-').map(Number);
    const oneYearAgo = `${year - 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return oneYearAgo;
  }, []);

  const netWorthTrendResult = useNetWorthTrend(
    trendStartDate,
    reportDate,
    30, // 30-day intervals
    conversionCurrency
  );

  // Comparison data
  const comparisonResult = useComparisonData(reportDate, comparisonType, conversionCurrency);

  return {
    // Balance sheet data
    balanceSheet,
    isLoadingBalanceSheet,
    balanceSheetError,

    // Net worth trend
    netWorthTrend: netWorthTrendResult.data,
    isLoadingTrend: netWorthTrendResult.isLoading,
    trendError: netWorthTrendResult.error,

    // Comparison
    comparison: comparisonResult.data,
    isLoadingComparison: comparisonResult.isLoading,
    comparisonError: comparisonResult.error,

    // Parameters
    reportDate,
    setReportDate,
    comparisonType,
    setComparisonType,
    conversionCurrency,
    setConversionCurrency,

    // Data for child components
    manualAssets,
  };
}
