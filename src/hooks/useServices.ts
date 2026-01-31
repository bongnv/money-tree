import { useMemo } from 'react';
import { CalculationService } from '@/services/calculation.service';
import { ReportService } from '@/services/report.service';
import { AccountService } from '@/services/account.service';
import { TransactionService } from '@/services/transaction.service';
import { CategoryService } from '@/services/category.service';
import { TransactionTypeService } from '@/services/transactionType.service';
import { BudgetService } from '@/services/budget.service';
import { AssetService } from '@/services/asset.service';
import { ExchangeRateService } from '@/services/exchangeRate.service';
import { SyncMetadataService } from '@/services/syncMetadata.service';
import { db } from '@/db/database';
import type { ArchivedYearReference, YearEndSummary } from '@/types/models';
import { CurrencyCode } from '@/types/enums';

/**
 * Archive Service for Dexie architecture
 * Handles year-end archiving with proper balance recalculation
 */
class DexieArchiveService {
  constructor(private syncMetadataService: SyncMetadataService) {}

  /**
   * Calculate year-end summary with closing balances
   */
  async calculateYearEndSummary(
    year: number,
    _baseCurrency: CurrencyCode
  ): Promise<YearEndSummary> {
    const transactions = await db.transactions.toArray();
    const accounts = await db.accounts.toArray();
    const assets = await db.manualAssets.toArray();

    // Get transactions up to and including the archived year
    const transactionsUpToYear = transactions.filter((t) => new Date(t.date).getFullYear() <= year);

    // Calculate closing balances for each account (starting from initialBalance)
    const closingBalances: Record<string, number> = {};
    for (const account of accounts) {
      let balance = account.initialBalance || 0;

      // Apply all transactions for this account up to the year end
      for (const txn of transactionsUpToYear) {
        if (txn.toAccountId === account.id) {
          balance += txn.amount;
        }
        if (txn.fromAccountId === account.id) {
          balance -= txn.amount;
        }
      }

      closingBalances[account.id] = balance;
    }

    // Calculate asset valuations at year end
    const closingAssetValuations: Record<string, number> = {};
    for (const asset of assets) {
      // Get the last valuation for this asset up to year end
      const assetTxns = transactionsUpToYear
        .filter((t) => t.fromAssetId === asset.id || t.toAssetId === asset.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (assetTxns.length > 0) {
        closingAssetValuations[asset.id] = assetTxns[0].amount;
      }
    }

    // Calculate net worth
    const totalAccountBalances = Object.values(closingBalances).reduce((sum, bal) => sum + bal, 0);
    const totalAssetValue = Object.values(closingAssetValuations).reduce(
      (sum, val) => sum + val,
      0
    );

    const yearTransactions = transactions.filter((t) => new Date(t.date).getFullYear() === year);

    return {
      transactionCount: yearTransactions.length,
      closingNetWorth: totalAccountBalances + totalAssetValue,
      closingBalances,
      closingAssetValuations,
    };
  }

  /**
   * Identify the oldest archivable year
   * Returns only the OLDEST completed year to ensure sequential archiving
   * (Account initial balances depend on previous year's closing balances)
   * Only returns a year if we have MORE than 2 years of data
   */
  async identifyArchivableYear(): Promise<number | null> {
    const txs = await db.transactions.toArray();
    if (txs.length === 0) return null;

    // Get unique years from transactions
    const years = new Set(txs.map((t) => new Date(t.date).getFullYear()));
    const sortedYears = Array.from(years).sort((a, b) => a - b);

    // Only archive if we have more than 2 years of data
    if (sortedYears.length <= 2) {
      return null;
    }

    // Return the oldest year (first in sorted array)
    return sortedYears[0];
  }

  /**
   * Get list of archived years
   */
  async getArchivedYears(): Promise<ArchivedYearReference[]> {
    return await this.syncMetadataService.getArchivedYears();
  }

  /**
   * Create archive file containing all data for the year
   */
  async createArchiveFile(
    year: number,
    baseCurrency: CurrencyCode
  ): Promise<import('@/types/models').ArchiveFile> {
    const summary = await this.calculateYearEndSummary(year, baseCurrency);

    // Get all data for the year
    const transactions = await db.transactions
      .filter((t) => new Date(t.date).getFullYear() === year)
      .toArray();

    const accounts = await db.accounts.toArray();
    const categories = await db.categories.toArray();
    const transactionTypes = await db.transactionTypes.toArray();
    const budgets = await db.budgets
      .filter((b) => {
        const startYear = new Date(b.startDate).getFullYear();
        const endYear = b.endDate ? new Date(b.endDate).getFullYear() : startYear;
        return startYear <= year && endYear >= year;
      })
      .toArray();

    const assets = await db.manualAssets.toArray();

    const exchangeRates = await db.exchangeRates
      .filter((er) => er.month.startsWith(year.toString()))
      .toArray();

    return {
      version: '1.0',
      year,
      summary,
      transactions,
      accounts: JSON.parse(JSON.stringify(accounts)), // Deep clone
      categories: JSON.parse(JSON.stringify(categories)),
      transactionTypes: JSON.parse(JSON.stringify(transactionTypes)),
      budgets,
      exchangeRates,
      manualAssets: assets,
      archivedDate: new Date().toISOString(),
    };
  }

  /**
   * Save archive and update main database
   * 1. Calculate closing balances for accounts
   * 2. Remove archived year transactions
   * 3. Update account initial balances to closing balances
   * 4. Remove archived year budgets
   *
   * Note: Archive reference is added via useSyncMetadataMutations hook in the component
   * to ensure proper sync triggering
   */
  async saveArchiveFile(archiveFile: {
    year: number;
    summary: {
      closingBalances: Record<string, number>;
      closingAssetValuations: Record<string, number>;
    };
  }): Promise<void> {
    const year = archiveFile.year;
    const summary = archiveFile.summary;

    // Step 1: Get closing balances from summary
    const closingBalances = summary.closingBalances as Record<string, number>;

    // Step 2: Remove transactions from the archived year
    await db.transactions.filter((t) => new Date(t.date).getFullYear() === year).delete();

    // Step 3: Update account initial balances to year-end closing balances
    const accounts = await db.accounts.toArray();
    for (const account of accounts) {
      if (closingBalances[account.id] !== undefined) {
        await db.accounts.update(account.id, {
          initialBalance: closingBalances[account.id],
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Step 4: Remove budgets from the archived year
    const budgetsToDelete = await db.budgets
      .filter((b) => {
        const startYear = new Date(b.startDate).getFullYear();
        const endYear = b.endDate ? new Date(b.endDate).getFullYear() : startYear;
        return startYear === year || endYear === year;
      })
      .toArray();

    for (const budget of budgetsToDelete) {
      await db.budgets.delete(budget.id);
    }

    // Archive file is created but cloud storage handled by user download
    // User can manually download archive file if needed
  }

  updateMainFileAfterArchive(_year: number, _reference: ArchivedYearReference): void {
    // No-op - saveArchiveFile handles everything
  }
}

// Singleton instances
let syncMetadataServiceInstance: SyncMetadataService | null = null;
let accountServiceInstance: AccountService | null = null;
let transactionServiceInstance: TransactionService | null = null;
let categoryServiceInstance: CategoryService | null = null;
let transactionTypeServiceInstance: TransactionTypeService | null = null;
let budgetServiceInstance: BudgetService | null = null;
let assetServiceInstance: AssetService | null = null;
let exchangeRateServiceInstance: ExchangeRateService | null = null;
let calculationServiceInstance: CalculationService | null = null;
let archiveServiceInstance: DexieArchiveService | null = null;
let reportServiceInstance: ReportService | null = null;

function getSyncMetadataService(): SyncMetadataService {
  if (!syncMetadataServiceInstance) {
    syncMetadataServiceInstance = new SyncMetadataService(db);
  }
  return syncMetadataServiceInstance;
}

function getCalculationService(): CalculationService {
  if (!calculationServiceInstance) {
    calculationServiceInstance = new CalculationService();
  }
  return calculationServiceInstance;
}

/**
 * Get ArchiveService instance (singleton)
 */
function getArchiveService(): DexieArchiveService {
  if (!archiveServiceInstance) {
    archiveServiceInstance = new DexieArchiveService(getSyncMetadataService());
  }
  return archiveServiceInstance;
}

/**
 * Hook to get ArchiveService instance
 */
export function useArchiveService(): DexieArchiveService {
  return useMemo(() => getArchiveService(), []);
}

/**
 * Hook to get CalculationService instance
 */
export function useCalculationService(): CalculationService {
  return useMemo(() => getCalculationService(), []);
}

/**
 * Get ReportService instance (singleton)
 */
function getReportService(): ReportService {
  if (!reportServiceInstance) {
    reportServiceInstance = new ReportService(getCalculationService());
  }
  return reportServiceInstance;
}

/**
 * Hook to get ReportService instance
 */
export function useReportService(): ReportService {
  return useMemo(() => getReportService(), []);
}

/**
 * Get AccountService instance (singleton)
 */
function getAccountService(): AccountService {
  if (!accountServiceInstance) {
    accountServiceInstance = new AccountService(db, getSyncMetadataService());
  }
  return accountServiceInstance;
}

/**
 * Hook to get AccountService instance
 */
export function useAccountService(): AccountService {
  return useMemo(() => getAccountService(), []);
}

/**
 * Get TransactionService instance (singleton)
 */
function getTransactionService(): TransactionService {
  if (!transactionServiceInstance) {
    transactionServiceInstance = new TransactionService(db, getSyncMetadataService());
  }
  return transactionServiceInstance;
}

/**
 * Hook to get TransactionService instance
 */
export function useTransactionService(): TransactionService {
  return useMemo(() => getTransactionService(), []);
}

/**
 * Get CategoryService instance (singleton)
 */
function getCategoryService(): CategoryService {
  if (!categoryServiceInstance) {
    categoryServiceInstance = new CategoryService(db, getSyncMetadataService());
  }
  return categoryServiceInstance;
}

/**
 * Hook to get CategoryService instance
 */
export function useCategoryService(): CategoryService {
  return useMemo(() => getCategoryService(), []);
}

/**
 * Get TransactionTypeService instance (singleton)
 */
function getTransactionTypeService(): TransactionTypeService {
  if (!transactionTypeServiceInstance) {
    transactionTypeServiceInstance = new TransactionTypeService(db, getSyncMetadataService());
  }
  return transactionTypeServiceInstance;
}

/**
 * Hook to get TransactionTypeService instance
 */
export function useTransactionTypeService(): TransactionTypeService {
  return useMemo(() => getTransactionTypeService(), []);
}

/**
 * Get BudgetService instance (singleton)
 */
function getBudgetService(): BudgetService {
  if (!budgetServiceInstance) {
    budgetServiceInstance = new BudgetService(db, getSyncMetadataService());
  }
  return budgetServiceInstance;
}

/**
 * Hook to get BudgetService instance
 */
export function useBudgetService(): BudgetService {
  return useMemo(() => getBudgetService(), []);
}

/**
 * Get AssetService instance (singleton)
 */
function getAssetService(): AssetService {
  if (!assetServiceInstance) {
    assetServiceInstance = new AssetService(db, getSyncMetadataService());
  }
  return assetServiceInstance;
}

/**
 * Hook to get AssetService instance
 */
export function useAssetService(): AssetService {
  return useMemo(() => getAssetService(), []);
}

/**
 * Get ExchangeRateService instance (singleton)
 */
function getExchangeRateService(): ExchangeRateService {
  if (!exchangeRateServiceInstance) {
    exchangeRateServiceInstance = new ExchangeRateService(db, getSyncMetadataService());
  }
  return exchangeRateServiceInstance;
}

/**
 * Hook to get ExchangeRateService instance
 */
export function useExchangeRateService(): ExchangeRateService {
  return useMemo(() => getExchangeRateService(), []);
}

/**
 * Hook to get SyncMetadataService instance
 */
export function useSyncMetadataService(): SyncMetadataService {
  return useMemo(() => getSyncMetadataService(), []);
}

/**
 * Hook to get all services at once
 */
export function useServices() {
  return {
    archive: useArchiveService(),
    calculation: useCalculationService(),
    report: useReportService(),
    account: useAccountService(),
    transaction: useTransactionService(),
    category: useCategoryService(),
    transactionType: useTransactionTypeService(),
    budget: useBudgetService(),
    asset: useAssetService(),
    exchangeRate: useExchangeRateService(),
    syncMetadata: useSyncMetadataService(),
  };
}
