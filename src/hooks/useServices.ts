import { useMemo } from 'react';
import { CalculationService } from '@/services/calculation.service';
import { ReportService } from '@/services/report.service';
import type { MoneyTreeDB } from '@/db/database';
import type {
  ArchivedYearReference,
  YearEndSummary,
  Transaction,
  Budget,
  ExchangeRate,
  ArchiveFile,
} from '@/types/models';
import { CurrencyCode } from '@/types/enums';
import { getRateSync } from '@/utils/exchangeRate.utils';
import { getAssetCurrentValue } from '@/utils/asset.utils';
import { db } from '@/db/database';

/**
 * Archive Service for Dexie architecture
 * Handles year-end archiving with proper balance recalculation
 */
class DexieArchiveService {
  constructor(private db: MoneyTreeDB) {}

  /**
   * Calculate year-end summary with closing balances
   * Converts all balances to the base currency using year-end exchange rates
   */
  async calculateYearEndSummary(year: number, baseCurrency: CurrencyCode): Promise<YearEndSummary> {
    const transactions = await this.db.transactions.toArray();
    const accounts = await this.db.accounts.toArray();
    const assets = await this.db.manualAssets.toArray();

    // Load all exchange rates for currency conversion
    const exchangeRates = await this.db.exchangeRates.toArray();
    const ratesMap = new Map<string, number>();
    for (const rate of exchangeRates) {
      const key = `${rate.month}_${rate.fromCurrency}_${rate.toCurrency}`;
      ratesMap.set(key, rate.rate);
    }

    // Use December of the year for exchange rate lookups
    const rateMonth = `${year}-12`;

    // Get transactions up to and including the archived year
    const transactionsUpToYear = transactions.filter(
      (t: Transaction) => new Date(t.date).getFullYear() <= year
    );

    // Calculate closing balances for each account (starting from initialBalance)
    const closingBalances: Record<string, number> = {};
    let totalAccountBalances = 0;

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

      // Convert to base currency for net worth calculation
      let convertedBalance = balance;
      if (account.currencyCode !== baseCurrency) {
        try {
          const rate = getRateSync(ratesMap, rateMonth, account.currencyCode, baseCurrency);
          convertedBalance = balance * rate;
        } catch {
          console.warn(
            `Exchange rate not found for ${account.currencyCode} to ${baseCurrency} in ${rateMonth}, using original balance`
          );
          // If rate not found, use original balance as fallback
        }
      }
      totalAccountBalances += convertedBalance;
    }

    // Calculate asset valuations at year end
    const closingAssetValuations: Record<string, number> = {};
    let totalAssetValue = 0;

    for (const asset of assets) {
      // Get current value at year end
      let assetValue = getAssetCurrentValue(asset);

      // For assets with value history, get the value at year end
      if (asset.valueHistory && asset.valueHistory.length > 0) {
        const yearEndDate = `${year}-12-31`;
        // Find the last value on or before year end
        const relevantValues = asset.valueHistory
          .filter((v: { date: string; value: number }) => v.date <= yearEndDate)
          .sort((a: { date: string; value: number }, b: { date: string; value: number }) =>
            b.date.localeCompare(a.date)
          );

        if (relevantValues.length > 0) {
          assetValue = relevantValues[0].value;
        }
      }

      closingAssetValuations[asset.id] = assetValue;

      // Convert to base currency for net worth calculation
      let convertedValue = assetValue;
      if (asset.currencyCode !== baseCurrency) {
        try {
          const rate = getRateSync(ratesMap, rateMonth, asset.currencyCode, baseCurrency);
          convertedValue = assetValue * rate;
        } catch {
          console.warn(
            `Exchange rate not found for ${asset.currencyCode} to ${baseCurrency} in ${rateMonth}, using original value`
          );
          // If rate not found, use original value as fallback
        }
      }
      totalAssetValue += convertedValue;
    }

    const yearTransactions = transactions.filter(
      (t: Transaction) => new Date(t.date).getFullYear() === year
    );

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
    const txs = await this.db.transactions.toArray();
    if (txs.length === 0) return null;

    // Get unique years from transactions
    const years = new Set(txs.map((t: Transaction) => new Date(t.date).getFullYear()));
    const sortedYears = Array.from(years).sort((a: number, b: number) => a - b);

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
    const record = await this.db.syncMetadata.get('archivedYears');
    return (record?.value as ArchivedYearReference[]) || [];
  }

  /**
   * Create archive file containing all data for the year
   */
  async createArchiveFile(year: number, baseCurrency: CurrencyCode): Promise<ArchiveFile> {
    const summary = await this.calculateYearEndSummary(year, baseCurrency);

    // Get all data for the year
    const transactions = await this.db.transactions
      .filter((t: Transaction) => new Date(t.date).getFullYear() === year)
      .toArray();

    const accounts = await this.db.accounts.toArray();
    const categories = await this.db.categories.toArray();
    const transactionTypes = await this.db.transactionTypes.toArray();
    const budgets = await this.db.budgets
      .filter((b: Budget) => {
        const startYear = new Date(b.startDate).getFullYear();
        const endYear = b.endDate ? new Date(b.endDate).getFullYear() : startYear;
        return startYear <= year && endYear >= year;
      })
      .toArray();

    const assets = await this.db.manualAssets.toArray();

    const exchangeRates = await this.db.exchangeRates
      .filter((er: ExchangeRate) => er.month.startsWith(year.toString()))
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
    await this.db.transactions
      .filter((t: Transaction) => new Date(t.date).getFullYear() === year)
      .delete();

    // Step 3: Update account initial balances to year-end closing balances
    const accounts = await this.db.accounts.toArray();
    for (const account of accounts) {
      if (closingBalances[account.id] !== undefined) {
        await this.db.accounts.update(account.id, {
          initialBalance: closingBalances[account.id],
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Step 4: Remove budgets from the archived year
    const budgetsToDelete = await this.db.budgets
      .filter((b: Budget) => {
        const startYear = new Date(b.startDate).getFullYear();
        const endYear = b.endDate ? new Date(b.endDate).getFullYear() : startYear;
        return startYear === year || endYear === year;
      })
      .toArray();

    for (const budget of budgetsToDelete) {
      await this.db.budgets.delete(budget.id);
    }

    // Archive file is created but cloud storage handled by user download
    // User can manually download archive file if needed
  }
}

// Singleton instances
let calculationServiceInstance: CalculationService | null = null;
let archiveServiceInstance: DexieArchiveService | null = null;
let reportServiceInstance: ReportService | null = null;

function getCalculationService(): CalculationService {
  if (!calculationServiceInstance) {
    calculationServiceInstance = new CalculationService();
  }
  return calculationServiceInstance;
}

/**
 * Get ArchiveService instance (singleton)
 */
function getArchiveService(db: MoneyTreeDB): DexieArchiveService {
  if (!archiveServiceInstance) {
    archiveServiceInstance = new DexieArchiveService(db);
  }
  return archiveServiceInstance;
}

/**
 * Hook to get ArchiveService instance
 */
export function useArchiveService(): DexieArchiveService {
  return useMemo(() => getArchiveService(db), []);
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
 * Hook to get all services at once
 */
export function useServices() {
  return {
    archive: useArchiveService(),
    calculation: useCalculationService(),
    report: useReportService(),
  };
}
