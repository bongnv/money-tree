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
import { useAppStore } from '../stores/useAppStore';
import { calculationService } from './calculation.service';
import { StorageFactory } from './storage/StorageFactory';
import type {
  ArchiveFile,
  ArchivedYearReference,
  YearEndSummary,
  ExchangeRate,
} from '../types/models';
import { CurrencyCode } from '../types/enums';
import { getAssetClosingValue } from '../utils/asset.utils';

/**
 * Calculate year-end summary for a specific year
 */
export function calculateYearEndSummary(year: number, baseCurrency: CurrencyCode): YearEndSummary {
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

  // Calculate closing valuations for each manual asset
  const closingAssetValuations: Record<string, number> = {};
  manualAssets.forEach((asset) => {
    closingAssetValuations[asset.id] = getAssetClosingValue(asset, year);
  });

  return {
    transactionCount,
    closingNetWorth,
    closingBalances,
    closingAssetValuations,
  };
}

/**
 * Identify the oldest year that can be archived
 * Returns only the OLDEST year to ensure initialBalance is correct when archiving
 * Excludes years less than 2 years older than current year (e.g., in 2026, only 2024 and below are eligible)
 *
 * Important: Only oldest year can be archived to maintain data integrity:
 * - Archiving removes transactions from main file
 * - Account initialBalance for next year depends on archived year's closing balances
 * - Must archive sequentially from oldest to newest
 *
 * @returns The oldest archivable year, or null if no year is eligible
 */
export function identifyArchivableYear(): number | null {
  const transactions = useTransactionStore.getState().transactions;
  const currentYear = new Date().getFullYear();
  const cutoffYear = currentYear - 2; // Only years at least 2 years old

  let oldestYear: number | null = null;

  // Find the oldest eligible year in a single pass
  for (const transaction of transactions) {
    const year = new Date(transaction.date).getFullYear();
    if (year <= cutoffYear && (oldestYear === null || year < oldestYear)) {
      oldestYear = year;
    }
  }

  return oldestYear;
}

/**
 * Create archive file for a specific year
 * Extracts all data for the year and creates a self-contained archive
 */
export function createArchiveFile(year: number, baseCurrency: CurrencyCode): ArchiveFile {
  const transactions = useTransactionStore.getState().transactions;
  const budgets = useBudgetStore.getState().budgets;
  const manualAssets = useAssetStore.getState().manualAssets;
  const accounts = useAccountStore.getState().accounts;
  const categories = useCategoryStore.getState().categories;
  const transactionTypes = useCategoryStore.getState().transactionTypes;
  const exchangeRates = useExchangeRateStore.getState().rates;

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
    valueHistory: asset.valueHistory.filter((entry: { date: string; value: number }) => {
      const entryYear = new Date(entry.date).getFullYear();
      return entryYear === year;
    }),
  }));

  // Exchange rates - include those from this year
  const yearExchangeRates = exchangeRates.filter((rate: ExchangeRate) => {
    const rateYear = parseInt(rate.month.split('-')[0], 10);
    return rateYear === year;
  });

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
    exchangeRates: yearExchangeRates,
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
  const fileName = provider.getFileName();
  const archiveFileName = fileName.replace('.json', `-${archiveFile.year}.json`);
  const content = JSON.stringify(archiveFile);
  await provider.saveFile(content, archiveFileName);
}

/**
 * Update main file after archiving a year
 * Removes archived year's data from stores and adds archive reference
 */
export function updateMainFileAfterArchive(
  year: number,
  archiveReference: ArchivedYearReference
): void {
  const transactionStore = useTransactionStore.getState();
  const budgetStore = useBudgetStore.getState();
  const assetStore = useAssetStore.getState();
  const accountStore = useAccountStore.getState();
  const exchangeRateStore = useExchangeRateStore.getState();

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
    valueHistory: asset.valueHistory.filter((entry: { date: string; value: number }) => {
      const entryYear = new Date(entry.date).getFullYear();
      return entryYear !== year;
    }),
  }));
  assetStore.setManualAssets(updatedAssets);

  // Remove exchange rates from the archived year
  const remainingExchangeRates = exchangeRateStore.rates.filter((rate: ExchangeRate) => {
    const rateYear = parseInt(rate.month.split('-')[0], 10);
    return rateYear !== year;
  });
  exchangeRateStore.setRates(remainingExchangeRates);

  // Add archive reference to app state (using the one passed in)
  const appState = useAppStore.getState();
  appState.addArchivedYear(archiveReference);
}

/**
 * Get archived year references from app store
 */
export function getArchivedYears(): ArchivedYearReference[] {
  const appState = useAppStore.getState();
  return appState.archivedYears;
}
