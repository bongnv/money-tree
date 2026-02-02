import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useReportService } from '../useServices';
import { useExchangeRates } from '../useExchangeRates';
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
  const { accounts, assets, transactions, baseCurrency } = useStore();
  const reportService = useReportService();

  // Report parameters
  const today = getTodayDate();
  const [reportDate, setReportDate] = useState<string>(today);
  const [comparisonType, setComparisonType] = useState<ComparisonType>('month');
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCodeType | undefined>(
    undefined
  );

  // Set conversion currency to default currency initially
  useEffect(() => {
    setConversionCurrency(baseCurrency);
  }, [baseCurrency]);

  // Get exchange rates map
  const ratesMap = useExchangeRates();

  // Compute balance sheet with loaded rates using useMemo
  const balanceSheetResult = useMemo(() => {
    if (!accounts || !assets || !transactions || !ratesMap || !conversionCurrency) {
      return { data: null, error: null };
    }

    try {
      const result = reportService.calculateBalanceSheet(
        accounts,
        assets,
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
  }, [accounts, assets, transactions, reportDate, conversionCurrency, ratesMap, reportService]);

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
    !assets ||
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

    // Comparison
    comparison: comparisonResult.data,

    // Parameters
    reportDate,
    setReportDate,
    comparisonType,
    setComparisonType,
    conversionCurrency: conversionCurrency ?? CurrencyCode.USD,
    setConversionCurrency,

    // Data for child components
    assets,
  };
}
