/**
 * Archive Service
 * Handles archive detection, year-end summary calculation, and archivable year identification
 */

import { useTransactionStore } from '../stores/useTransactionStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useAssetStore } from '../stores/useAssetStore';
import { useExchangeRateStore } from '../stores/useExchangeRateStore';
import { calculationService } from './calculation.service';

export interface YearEndSummary {
  year: number;
  transactionCount: number;
  netWorth: number;
  estimatedSizeKB: number;
}

/**
 * Check if archive trigger conditions are met (3+ years exist in main file)
 */
export function detectArchiveTrigger(): boolean {
  const transactions = useTransactionStore.getState().transactions;

  // Get unique years from transactions
  const years = new Set<number>();
  transactions.forEach((transaction) => {
    const year = new Date(transaction.date).getFullYear();
    years.add(year);
  });

  return years.size >= 3;
}

/**
 * Calculate year-end summary for a specific year
 */
export function calculateYearEndSummary(year: number, baseCurrency: string): YearEndSummary {
  const transactions = useTransactionStore.getState().transactions;
  const accounts = useAccountStore.getState().accounts;
  const manualAssets = useAssetStore.getState().manualAssets;
  const { getRateForMonth } = useExchangeRateStore.getState();

  // Count transactions for the year
  const yearTransactions = transactions.filter((transaction) => {
    const txYear = new Date(transaction.date).getFullYear();
    return txYear === year;
  });

  const transactionCount = yearTransactions.length;

  // Calculate net worth at year end
  const yearEndMonth = `${year}-12`;
  const netWorth = calculationService.calculateNetWorth(
    accounts,
    transactions,
    manualAssets,
    baseCurrency,
    getRateForMonth,
    yearEndMonth
  );

  // Estimate file size (rough approximation: 500 bytes per transaction)
  const estimatedSizeKB = Math.round((transactionCount * 500) / 1024);

  return {
    year,
    transactionCount,
    netWorth,
    estimatedSizeKB,
  };
}

/**
 * Identify years that can be archived (oldest years in the file)
 * Returns array of years sorted from oldest to newest
 */
export function identifyArchivableYears(): number[] {
  const transactions = useTransactionStore.getState().transactions;

  // Get unique years from transactions
  const years = new Set<number>();
  transactions.forEach((transaction) => {
    const year = new Date(transaction.date).getFullYear();
    years.add(year);
  });

  // Convert to sorted array (oldest first)
  return Array.from(years).sort((a, b) => a - b);
}

/**
 * Check if archive prompt should be shown based on conditions and user preferences
 * @param lastPostponedDate ISO date string when user last postponed, or null
 */
export function shouldPromptArchive(lastPostponedDate: string | null): boolean {
  // Check if 3+ years exist
  if (!detectArchiveTrigger()) {
    return false;
  }

  // If never postponed, show prompt
  if (!lastPostponedDate) {
    return true;
  }

  // Check if 30 days have passed since last postpone
  const lastPostponed = new Date(lastPostponedDate);
  const now = new Date();
  const daysSincePostpone = Math.floor(
    (now.getTime() - lastPostponed.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSincePostpone >= 30;
}
