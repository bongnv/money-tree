import { useState } from 'react';
import { useAccounts, useAssets, useTransactions } from '../index';
import { useAsyncComputation } from '../primitives/useAsyncComputation';
import { useReportService } from '../useServices';
import { useBaseCurrency } from '../useSyncMetadata';
import { useNetWorthTrend } from './shared/useNetWorthTrend';
import { useComparisonData, type ComparisonType } from './shared/useComparisonData';
import type { BalanceSheetData } from '@/services/report.service';
import type { CurrencyCode } from '@/types/enums';

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
  const today = new Date().toISOString().split('T')[0];
  const [reportDate, setReportDate] = useState<string>(today);
  const [comparisonType, setComparisonType] = useState<ComparisonType>('month');
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCode>(defaultCurrency);

  // Balance sheet computation
  const {
    data: balanceSheet,
    status: balanceSheetStatus,
    error: balanceSheetError,
    refresh: refreshBalanceSheet,
  } = useAsyncComputation<BalanceSheetData>(
    async () => {
      return await reportService.calculateBalanceSheet(
        accounts,
        manualAssets,
        transactions,
        reportDate,
        conversionCurrency
      );
    },
    [],
    { immediate: true }
  );

  // Net worth trend (last 12 months)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const trendStartDate = oneYearAgo.toISOString().split('T')[0];
  
  const netWorthTrendResult = useNetWorthTrend(
    trendStartDate,
    reportDate,
    30, // 30-day intervals
    conversionCurrency
  );

  // Comparison data
  const comparisonResult = useComparisonData(
    reportDate,
    comparisonType,
    conversionCurrency
  );

  return {
    // Balance sheet data
    balanceSheet,
    isLoadingBalanceSheet: balanceSheetStatus === 'loading',
    balanceSheetError,
    refreshBalanceSheet,

    // Net worth trend
    netWorthTrend: netWorthTrendResult.data,
    isLoadingTrend: netWorthTrendResult.status === 'loading',
    trendError: netWorthTrendResult.error,
    refreshTrend: netWorthTrendResult.refresh,

    // Comparison
    comparison: comparisonResult.data,
    isLoadingComparison: comparisonResult.status === 'loading',
    comparisonError: comparisonResult.error,
    refreshComparison: comparisonResult.refresh,

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
