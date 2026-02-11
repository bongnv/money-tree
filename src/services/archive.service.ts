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
import type { CloudItem } from './storage/IStorageProvider';
import type { CloudService } from './cloud.service';
import { CalculationService } from './calculation.service';

/**
 * Archive Service
 * Handles year-end archiving with proper balance recalculation and cloud upload
 */
export class ArchiveService {
  private calculationService: CalculationService;

  constructor(
    private db: MoneyTreeDB,
    private cloudService: CloudService
  ) {
    this.calculationService = new CalculationService();
  }

  /**
   * Calculate year-end summary with closing balances
   * Converts all balances to the base currency using year-end exchange rates
   */
  async calculateYearEndSummary(year: number): Promise<YearEndSummary> {
    // Load base currency from DB
    const metadata = await this.db.syncMetadata.get('baseCurrency');
    const baseCurrency = (metadata?.value as CurrencyCode) || CurrencyCode.USD;
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

    // Calculate closing balances using CalculationService
    const accountBalances = this.calculationService.calculateAccountBalances(
      accounts,
      transactionsUpToYear
    );
    const closingBalances: Record<string, number> = {};
    let totalAccountBalances = 0;

    for (const account of accounts) {
      const balance = accountBalances.get(account.id) || 0;
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
      // Only consider history up to the archived year
      if (asset.valueHistory && asset.valueHistory.length > 0) {
        const yearEndDate = `${year}-12-31`;
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
   * Create archive file containing all data for the year
   */
  private async createArchiveFile(year: number): Promise<ArchiveFile> {
    const summary = await this.calculateYearEndSummary(year);

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
      accounts,
      categories,
      transactionTypes,
      budgets,
      exchangeRates,
      manualAssets: assets,
      archivedDate: new Date().toISOString(),
    };
  }

  /**
   * Upload archive file to cloud storage
   * @param archiveFile Archive file to upload
   * @param archiveFolder Folder to store archive in
   * @returns CloudItem representing the uploaded file
   * @throws Error if upload fails - we must not proceed with data cleanup without a backup
   */
  private async uploadArchiveToCloud(
    archiveFile: ArchiveFile,
    archiveFolder: CloudItem
  ): Promise<CloudItem> {
    const fileName = `archive-${archiveFile.year}.json`;
    const content = JSON.stringify(archiveFile, null, 2);
    const blob = new Blob([content], { type: 'application/json' });

    // Create new file in archive folder
    const fileItem: CloudItem = {
      id: '', // Empty ID for new file
      name: fileName,
      isFolder: false,
      parentItemId: archiveFolder.id,
      driveId: archiveFolder.driveId,
    };

    try {
      const uploadedFile = await this.cloudService.writeFile(fileItem, blob);
      return uploadedFile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload archive to cloud: ${message}`);
    }
  }

  /**
   * Archive a year - complete atomic operation
   * 1. Creates archive file with all year data
   * 2. Uploads archive file to cloud (REQUIRED - throws if fails)
   * 3. Adds archive reference to metadata
   * 4. Removes archived year transactions
   * 5. Updates account initial balances to closing balances
   * 6. Updates manual asset value history (removes future entries)
   * 7. Removes archived year budgets
   * 8. Updates lastModified to trigger sync
   *
   * @param archiveFolder Folder to store archive in (required)
   * @returns Archive reference that was added
   */
  async archiveYear(year: number, archiveFolder: CloudItem): Promise<ArchivedYearReference> {
    // Step 1: Create archive file
    const archiveFile = await this.createArchiveFile(year);

    // Step 2: Upload to cloud (REQUIRED - throws if upload fails)
    await this.uploadArchiveToCloud(archiveFile, archiveFolder);

    // Step 3: Add archive reference to metadata BEFORE cleanup
    const archiveReference: ArchivedYearReference = {
      year,
      archivedDate: archiveFile.archivedDate,
      summary: archiveFile.summary,
    };

    const existing = await this.db.syncMetadata.get('archivedYears');
    const archivedYears = (existing?.value as ArchivedYearReference[]) || [];
    await this.db.syncMetadata.put({
      key: 'archivedYears',
      value: [...archivedYears, archiveReference],
    });

    // Step 4: Clean up archived data
    await this.cleanupArchivedData(archiveFile);

    // Step 5: Update lastModified to trigger sync
    await this.db.syncMetadata.put({
      key: 'lastModified',
      value: new Date().toISOString(),
    });

    return archiveReference;
  }

  /**
   * Clean up archived data from main database
   * 1. Remove archived year transactions
   * 2. Update account initial balances to closing balances
   * 3. Update manual asset value history (remove entries after archived year)
   * 4. Remove archived year budgets
   */
  private async cleanupArchivedData(archiveFile: {
    year: number;
    summary: {
      closingBalances: Record<string, number>;
      closingAssetValuations: Record<string, number>;
    };
  }): Promise<void> {
    const year = archiveFile.year;
    const summary = archiveFile.summary;
    const yearEndDate = `${year}-12-31`;

    // Step 1: Remove transactions from the archived year
    await this.db.transactions
      .filter((t: Transaction) => new Date(t.date).getFullYear() === year)
      .delete();

    // Step 2: Update account initial balances to year-end closing balances
    const closingBalances = summary.closingBalances as Record<string, number>;
    const accounts = await this.db.accounts.toArray();
    for (const account of accounts) {
      if (closingBalances[account.id] !== undefined) {
        await this.db.accounts.update(account.id, {
          initialBalance: closingBalances[account.id],
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Step 3: Update manual asset value history - remove entries after archived year
    const assets = await this.db.manualAssets.toArray();
    for (const asset of assets) {
      if (asset.valueHistory && asset.valueHistory.length > 0) {
        const filteredHistory = asset.valueHistory.filter(
          (v: { date: string; value: number }) => v.date <= yearEndDate
        );
        await this.db.manualAssets.update(asset.id, {
          valueHistory: filteredHistory,
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
  }
}
