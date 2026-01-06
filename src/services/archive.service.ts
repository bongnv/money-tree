/**
 * Archive Service
 * Handles archive detection, year-end summary calculation, archivable year identification,
 * and archive file creation and export
 */

import { useTransactionStore } from '../stores/useTransactionStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useAssetStore } from '../stores/useAssetStore';
import { useExchangeRateStore } from '../stores/useExchangeRateStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { calculationService } from './calculation.service';
import { StorageFactory } from './storage/StorageFactory';
import type { ArchiveFile, ArchivedYearReference, YearEndSummary } from '../types/models';
import { Currency } from '../types/enums';

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
export function calculateYearEndSummary(year: number, baseCurrency: Currency): YearEndSummary {
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
  const closingNetWorth = calculationService.calculateNetWorth(
    accounts,
    transactions,
    manualAssets,
    baseCurrency,
    getRateForMonth,
    yearEndMonth
  );

  // Calculate closing balances for each account
  const closingBalances: Record<string, number> = {};
  accounts.forEach((account) => {
    const balance = calculationService.calculateAccountBalance(account, yearTransactions);
    closingBalances[account.id] = balance;
  });

  return {
    transactionCount,
    closingNetWorth,
    closingBalances,
  };
}

/**
 * Identify years that can be archived (oldest years in the file)
 * Returns array of years sorted from oldest to newest
 * Excludes current year (cannot archive an incomplete year)
 */
export function identifyArchivableYears(): number[] {
  const transactions = useTransactionStore.getState().transactions;
  const currentYear = new Date().getFullYear();

  // Get unique years from transactions
  const years = new Set<number>();
  transactions.forEach((transaction) => {
    const year = new Date(transaction.date).getFullYear();
    // Only include completed years (not current year)
    if (year < currentYear) {
      years.add(year);
    }
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

/**
 * Create archive file for a specific year
 * Extracts all data for the year and creates a self-contained archive
 */
export function createArchiveFile(year: number, baseCurrency: Currency): ArchiveFile {
  const transactions = useTransactionStore.getState().transactions;
  const budgets = useBudgetStore.getState().budgets;
  const manualAssets = useAssetStore.getState().manualAssets;
  const accounts = useAccountStore.getState().accounts;
  const categories = useCategoryStore.getState().categories;
  const transactionTypes = useCategoryStore.getState().transactionTypes;

  // Filter data for the specified year
  const yearTransactions = transactions.filter((transaction) => {
    const txYear = new Date(transaction.date).getFullYear();
    return txYear === year;
  });

  const yearBudgets = budgets.filter((budget) => {
    const budgetStartYear = new Date(budget.startDate).getFullYear();
    const budgetEndYear = new Date(budget.endDate).getFullYear();
    return budgetStartYear === year || budgetEndYear === year;
  });

  // Manual assets - include those with valueHistory entries in this year
  const yearManualAssets = manualAssets.map((asset) => ({
    ...asset,
    valueHistory: (asset.valueHistory || []).filter((entry: { date: string; value: number }) => {
      const entryYear = new Date(entry.date).getFullYear();
      return entryYear === year;
    }),
  }));

  // Calculate year-end summary
  const summary = calculateYearEndSummary(year, baseCurrency);

  // Create archive file structure
  const archiveFile: ArchiveFile = {
    version: '1.0',
    year,
    accounts: JSON.parse(JSON.stringify(accounts)), // Deep clone
    categories: JSON.parse(JSON.stringify(categories)), // Deep clone
    transactionTypes: JSON.parse(JSON.stringify(transactionTypes)), // Deep clone
    transactions: yearTransactions,
    budgets: yearBudgets,
    manualAssets: yearManualAssets,
    archivedDate: new Date().toISOString(),
    summary,
  };

  return archiveFile;
}

/**
 * Save archive file using the current storage provider
 * Provider handles showing file picker (Local) or determining location (OneDrive)
 */
export async function saveArchiveFile(archiveFile: ArchiveFile): Promise<void> {
  const provider = StorageFactory.getCurrentProvider();
  await provider.saveArchiveFile(archiveFile);
}

/**
 * Update main file after archiving a year
 * Removes archived year's data from stores and adds archive reference
 */
export function updateMainFileAfterArchive(
  year: number,
  _archiveReference: ArchivedYearReference
): void {
  const transactionStore = useTransactionStore.getState();
  const budgetStore = useBudgetStore.getState();
  const assetStore = useAssetStore.getState();
  const accountStore = useAccountStore.getState();

  // Calculate closing balances for accounts before removing transactions
  const accountClosingBalances: Record<string, number> = {};
  accountStore.accounts.forEach((account) => {
    // Get all transactions up to and including the archived year
    const transactionsUpToYear = transactionStore.transactions.filter((transaction) => {
      const txYear = new Date(transaction.date).getFullYear();
      return txYear <= year;
    });

    // Calculate balance for this account
    const balance = calculationService.calculateAccountBalance(account, transactionsUpToYear);
    accountClosingBalances[account.id] = balance;
  });

  // Remove transactions from the archived year
  const remainingTransactions = transactionStore.transactions.filter((transaction) => {
    const txYear = new Date(transaction.date).getFullYear();
    return txYear !== year;
  });
  transactionStore.setTransactions(remainingTransactions);

  // Update account initial balances to closing balances from archived year
  const updatedAccounts = accountStore.accounts.map((account) => ({
    ...account,
    initialBalance: accountClosingBalances[account.id] ?? account.initialBalance,
    updatedAt: new Date().toISOString(),
  }));
  accountStore.setAccounts(updatedAccounts);

  // Remove budgets from the archived year
  const remainingBudgets = budgetStore.budgets.filter((budget) => {
    const budgetStartYear = new Date(budget.startDate).getFullYear();
    const budgetEndYear = new Date(budget.endDate).getFullYear();
    return budgetStartYear !== year && budgetEndYear !== year;
  });
  budgetStore.setBudgets(remainingBudgets);

  // Remove manual asset history entries from the archived year
  const updatedAssets = assetStore.manualAssets.map((asset) => ({
    ...asset,
    valueHistory: (asset.valueHistory || []).filter((entry: { date: string; value: number }) => {
      const entryYear = new Date(entry.date).getFullYear();
      return entryYear !== year;
    }),
  }));
  assetStore.setManualAssets(updatedAssets);

  // TODO: Add archive reference to useAppStore.archivedYears array
  // This will be implemented when we update DataFile structure to include archivedYears
}

/**
 * Get archived year references from app store
 */
export function getArchivedYears(): ArchivedYearReference[] {
  // TODO: This will be stored in useAppStore once we implement the full data structure
  // For now, return empty array
  return [];
}
