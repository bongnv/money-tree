import { useState, useMemo, useEffect } from 'react';
import { useAccounts, useAssets, useTransactions, useExchangeRates } from '../index';
import { useReportService } from '../useServices';
import { useBaseCurrency } from '../useSyncMetadata';
import { useNetWorthTrend } from './shared/useNetWorthTrend';
import { useComparisonData, type ComparisonType } from './shared/useComparisonData';
import { CurrencyCode } from '@/types/enums';
import type { CurrencyCode as CurrencyCodeType } from '@/types/enums';
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
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCodeType | undefined>(
    undefined
  );

  // Set conversion currency to base currency when it loads
  useEffect(() => {
    if (defaultCurrency && conversionCurrency === undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConversionCurrency(defaultCurrency);
    }
  }, [defaultCurrency, conversionCurrency]);

  // Get exchange rates map
  const ratesMap = useExchangeRates();

  // Compute balance sheet with loaded rates using useMemo
  const balanceSheetResult = useMemo(() => {
    if (!accounts || !manualAssets || !transactions || !ratesMap || !conversionCurrency) {
      return { data: null, error: null };
    }

    try {
      const result = reportService.calculateBalanceSheet(
        accounts,
        manualAssets,
        transactions,
        reportDate,
        conversionCurrency,
        ratesMap
      );

      return { data: result, error: null };
    } catch (err) {
      console.error('[useBalanceSheet] Computation failed', err);
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, [
    accounts,
    manualAssets,
    transactions,
    reportDate,
    conversionCurrency,
    ratesMap,
    reportService,
  ]);

  const balanceSheet = balanceSheetResult.data;
  const balanceSheetError = balanceSheetResult.error;

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
    conversionCurrency ?? CurrencyCode.USD
  );

  // Comparison data
  const comparisonResult = useComparisonData(
    reportDate,
    comparisonType,
    conversionCurrency ?? CurrencyCode.USD
  );

  // Derive loading state from data availability
  const isLoadingBalanceSheet =
    !accounts ||
    !manualAssets ||
    !transactions ||
    !ratesMap ||
    !conversionCurrency ||
    balanceSheet === null;

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
    conversionCurrency: conversionCurrency ?? CurrencyCode.USD,
    setConversionCurrency,

    // Data for child components
    manualAssets,
  };
}
