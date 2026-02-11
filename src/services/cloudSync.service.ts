import type { MoneyTreeDB } from '../db/database';
import { CloudItem } from './storage/IStorageProvider';
import type { CloudService } from './cloud.service';
import type { DataFile, ExchangeRate, ArchivedYearReference } from '../types/models';
import { CurrencyCode } from '../types/enums';
import { DataFileSchema } from '../schemas/models.schema';

/**
 * Represents the complete local data snapshot (unfiltered)
 * Contains all records including soft-deleted and archived items
 * Different from DataFile which is filtered for cloud storage
 */
type LocalDataSnapshot = {
  transactions: DataFile['transactions'];
  accounts: DataFile['accounts'];
  categories: DataFile['categories'];
  transactionTypes: DataFile['transactionTypes'];
  budgets: DataFile['budgets'];
  manualAssets: DataFile['manualAssets'];
  exchangeRates: ExchangeRate[];
  baseCurrency: CurrencyCode;
  archivedYears: ArchivedYearReference[];
  lastModified: string;
};

/**
 * Cloud Sync Service with Last-Write-Wins strategy
 * Stateless service that manages syncing data between IndexedDB and cloud storage
 * State management (file info) is handled by SyncProvider
 */
export class CloudSyncService {
  private cloudService: CloudService;
  private fileItem: CloudItem;
  private db: MoneyTreeDB;

  constructor(cloudService: CloudService, fileItem: CloudItem, db: MoneyTreeDB) {
    this.cloudService = cloudService;
    this.fileItem = fileItem;
    this.db = db;
  }

  /**
   * Upload merged data to cloud (Last-Write-Wins)
   * Takes merged result to avoid reloading from DB
   * Returns updated CloudItem (may have new id if it was a new file)
   */
  private async uploadToCloud(mergedData: LocalDataSnapshot): Promise<{ fileItem: CloudItem }> {
    // Filter out soft-deleted resources
    const transactions = mergedData.transactions.filter((t) => !t.isDeleted);
    const categories = mergedData.categories.filter((c) => !c.isDeleted);
    const budgets = mergedData.budgets.filter((b) => !b.isDeleted);
    const manualAssets = mergedData.manualAssets.filter((a) => !a.isDeleted);
    const accounts = mergedData.accounts.filter((account) => !account.isDeleted);
    const transactionTypes = mergedData.transactionTypes.filter((type) => !type.isDeleted);

    const dataFile: DataFile = {
      version: '1.0',
      transactions,
      accounts,
      categories,
      transactionTypes,
      budgets,
      manualAssets,
      exchangeRates: mergedData.exchangeRates,
      archivedYears: mergedData.archivedYears,
      baseCurrency: mergedData.baseCurrency,
      lastModified: mergedData.lastModified,
    };

    const content = JSON.stringify(dataFile);
    const blob = new Blob([content], { type: 'application/json' });
    const updatedFileItem = await this.cloudService.writeFile(this.fileItem, blob);
    return { fileItem: updatedFileItem };
  }

  /**
   * Download from cloud and merge with local snapshot (Last-Write-Wins)
   * Returns whether local has newer changes and merged results
   */
  private async downloadFromCloud(localSnapshot: LocalDataSnapshot): Promise<{
    hasLocalChanges: boolean;
    mergedData: LocalDataSnapshot;
  }> {
    const blob = await this.cloudService.readFile(this.fileItem);
    const content = await blob.text();
    const rawData = JSON.parse(content);

    // Validate cloud data with Zod schema
    const parseResult = DataFileSchema.safeParse(rawData);
    if (!parseResult.success) {
      console.error('Cloud data validation errors:', parseResult.error);
      throw new Error(
        `Invalid cloud data format: ${parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }

    const cloudData = parseResult.data as DataFile;

    // Merge with local snapshot using Last-Write-Wins
    const { hasLocalChanges, mergedData } = await this.mergeData(cloudData, localSnapshot);
    return { hasLocalChanges, mergedData };
  }

  /**
   * Merge cloud data with local snapshot using Last-Write-Wins strategy
   * Returns flag indicating if local has newer changes and merged data
   */
  private async mergeData(
    cloudData: DataFile,
    localSnapshot: LocalDataSnapshot
  ): Promise<{
    hasLocalChanges: boolean;
    mergedData: LocalDataSnapshot;
  }> {
    // Merge each entity type using Last-Write-Wins
    const transactionsResult = this.mergeByTimestamp(
      localSnapshot.transactions,
      cloudData.transactions
    );
    const accountsResult = this.mergeByTimestamp(localSnapshot.accounts, cloudData.accounts);
    const categoriesResult = this.mergeByTimestamp(localSnapshot.categories, cloudData.categories);
    const transactionTypesResult = this.mergeByTimestamp(
      localSnapshot.transactionTypes,
      cloudData.transactionTypes
    );
    const budgetsResult = this.mergeByTimestamp(localSnapshot.budgets, cloudData.budgets);
    const assetsResult = this.mergeByTimestamp(localSnapshot.manualAssets, cloudData.manualAssets);
    // Exchange rates don't have updatedAt, so just merge by ID
    const exchangeRatesResult = this.mergeExchangeRates(
      localSnapshot.exchangeRates,
      cloudData.exchangeRates
    );

    // Merge metadata using Last-Write-Wins
    const metadataResult = this.mergeMetadata(
      cloudData,
      localSnapshot.baseCurrency,
      localSnapshot.archivedYears,
      localSnapshot.lastModified
    );

    // Track if any local changes exist
    const hasLocalChanges =
      transactionsResult.hasLocalChanges ||
      accountsResult.hasLocalChanges ||
      categoriesResult.hasLocalChanges ||
      transactionTypesResult.hasLocalChanges ||
      budgetsResult.hasLocalChanges ||
      assetsResult.hasLocalChanges ||
      exchangeRatesResult.hasLocalChanges ||
      metadataResult.hasLocalChanges;

    // Update IndexedDB with merged data
    await Promise.all([
      this.db.transactions.bulkPut(transactionsResult.merged),
      this.db.accounts.bulkPut(accountsResult.merged),
      this.db.categories.bulkPut(categoriesResult.merged),
      this.db.transactionTypes.bulkPut(transactionTypesResult.merged),
      this.db.budgets.bulkPut(budgetsResult.merged),
      this.db.manualAssets.bulkPut(assetsResult.merged),
      this.db.exchangeRates.bulkPut(exchangeRatesResult.merged),
      this.updateMetadata(metadataResult),
    ]);

    return {
      hasLocalChanges,
      mergedData: {
        transactions: transactionsResult.merged,
        accounts: accountsResult.merged,
        categories: categoriesResult.merged,
        transactionTypes: transactionTypesResult.merged,
        budgets: budgetsResult.merged,
        manualAssets: assetsResult.merged,
        exchangeRates: exchangeRatesResult.merged,
        baseCurrency: metadataResult.baseCurrency,
        archivedYears: metadataResult.archivedYears,
        lastModified: metadataResult.lastModified,
      },
    };
  }

  /**
   * Update metadata in DB directly
   * Bypasses service layer to avoid updating lastModified
   */
  private async updateMetadata(
    metadataResult: Pick<LocalDataSnapshot, 'baseCurrency' | 'archivedYears' | 'lastModified'> & {
      hasLocalChanges: boolean;
    }
  ): Promise<void> {
    await this.db.syncMetadata.bulkPut([
      { key: 'baseCurrency', value: metadataResult.baseCurrency },
      {
        key: 'archivedYears',
        value: metadataResult.archivedYears,
      },
    ]);

    const current = await this.db.syncMetadata.get('lastModified');
    const currentLastModified = current?.value ? (current.value as string) : null;
    if (!currentLastModified || metadataResult.lastModified > currentLastModified) {
      await this.db.syncMetadata.put({ key: 'lastModified', value: metadataResult.lastModified });
    }
  }

  /**
   * Merge two arrays using Last-Write-Wins strategy
   * Items with newer updatedAt (or createdAt if updatedAt not available) timestamp win
   * Returns merged data and flag indicating if local has newer changes
   */
  private mergeByTimestamp<
    T extends { id: string; updatedAt?: string; createdAt: string; isDeleted?: boolean },
  >(local: T[], remote: T[]): { merged: T[]; hasLocalChanges: boolean } {
    const map = new Map<string, T>();
    let hasLocalChanges = false;

    // Add all local items
    local.forEach((item) => map.set(item.id, item));

    // Replace with remote if remote is newer, track if local is newer
    remote.forEach((item) => {
      const existing = map.get(item.id);
      if (!existing) {
        // New item from remote
        map.set(item.id, item);
      } else {
        // Use updatedAt if available, otherwise fall back to createdAt
        const remoteTimestamp = item.updatedAt || item.createdAt;
        const existingTimestamp = existing.updatedAt || existing.createdAt;

        if (remoteTimestamp > existingTimestamp) {
          // Remote is newer
          map.set(item.id, item);
        } else if (existingTimestamp > remoteTimestamp) {
          // Local is newer
          hasLocalChanges = true;
        }
        // If equal timestamps, no changes needed
      }
    });

    // Check for items that exist only in local (not in remote)
    // Skip soft-deleted items - they're intentionally not in cloud and shouldn't trigger uploads
    local.forEach((item) => {
      const hasInRemote = remote.some((r) => r.id === item.id);
      if (!hasInRemote && !item.isDeleted) {
        hasLocalChanges = true;
      }
    });

    return { merged: Array.from(map.values()), hasLocalChanges };
  }

  /**
   * Merge exchange rates by ID using createdAt timestamp
   * Returns merged data and flag indicating if local has newer changes
   */
  private mergeExchangeRates(
    local: ExchangeRate[],
    remote: ExchangeRate[]
  ): { merged: ExchangeRate[]; hasLocalChanges: boolean } {
    const map = new Map<string, ExchangeRate>();
    let hasLocalChanges = false;

    // Add all local items
    local.forEach((item) => map.set(item.id, item));

    // Replace with remote if remote is newer, track if local is newer
    remote.forEach((item) => {
      const existing = map.get(item.id);
      if (!existing) {
        // New item from remote
        map.set(item.id, item);
      } else if (item.createdAt > existing.createdAt) {
        // Remote is newer
        map.set(item.id, item);
      } else if (existing.createdAt > item.createdAt) {
        // Local is newer
        hasLocalChanges = true;
      }
      // If equal timestamps, no changes needed
    });

    // Check for items that exist only in local (not in remote)
    local.forEach((item) => {
      const hasInRemote = remote.some((r) => r.id === item.id);
      if (!hasInRemote) {
        hasLocalChanges = true;
      }
    });

    return { merged: Array.from(map.values()), hasLocalChanges };
  }

  /**
   * Merge metadata using Last-Write-Wins based on lastModified timestamp
   * Returns flag indicating if local metadata is newer and the merged metadata
   */
  private mergeMetadata(
    cloudData: DataFile,
    localBaseCurrency: CurrencyCode,
    localArchivedYears: ArchivedYearReference[],
    localLastModified: string
  ): Pick<LocalDataSnapshot, 'baseCurrency' | 'archivedYears' | 'lastModified'> & {
    hasLocalChanges: boolean;
  } {
    const cloudLastModified = cloudData.lastModified;

    // If cloud metadata is newer (or local has no lastModified), use cloud data
    if (!localLastModified || cloudLastModified > localLastModified) {
      return {
        hasLocalChanges: false,
        baseCurrency: cloudData.baseCurrency,
        archivedYears: cloudData.archivedYears || [],
        lastModified: cloudLastModified,
      };
    } else if (localLastModified > cloudLastModified) {
      // Local metadata is newer
      return {
        hasLocalChanges: true,
        baseCurrency: localBaseCurrency,
        archivedYears: localArchivedYears,
        lastModified: localLastModified,
      };
    }

    // Equal timestamps - use local data
    return {
      hasLocalChanges: false,
      baseCurrency: localBaseCurrency,
      archivedYears: localArchivedYears,
      lastModified: localLastModified,
    };
  }

  /**
   * Full bidirectional sync
   * Fetches local snapshot, downloads from cloud, merges, then uploads (only if local changes exist)
   * Optimized: skips upload if only remote changes were merged (nothing new to upload)
   * Returns updated CloudItem from upload and the merged lastModified timestamp
   */
  async fullSync(): Promise<{
    mergedLastModified: string;
    fileItem: CloudItem;
  }> {
    // Fetch local snapshot upfront
    const [
      allTransactions,
      allAccounts,
      allCategories,
      allTransactionTypes,
      allBudgets,
      allManualAssets,
      exchangeRates,
      baseCurrency,
      archivedYears,
      lastModified,
    ] = await Promise.all([
      this.db.transactions.toArray(),
      this.db.accounts.toArray(),
      this.db.categories.toArray(),
      this.db.transactionTypes.toArray(),
      this.db.budgets.toArray(),
      this.db.manualAssets.toArray(),
      this.db.exchangeRates.toArray(),
      this.db.syncMetadata.get('baseCurrency'),
      this.db.syncMetadata.get('archivedYears'),
      this.db.syncMetadata.get('lastModified'),
    ]);

    const localSnapshot: LocalDataSnapshot = {
      transactions: allTransactions,
      accounts: allAccounts,
      categories: allCategories,
      transactionTypes: allTransactionTypes,
      budgets: allBudgets,
      manualAssets: allManualAssets,
      exchangeRates,
      baseCurrency: (baseCurrency?.value as CurrencyCode) || CurrencyCode.USD,
      archivedYears: (archivedYears?.value as ArchivedYearReference[]) || [],
      lastModified: (lastModified?.value as string) || '1970-01-01T00:00:00.000Z',
    };

    // If file doesn't have an ID yet, it's a new file that hasn't been uploaded
    // Skip download and upload directly to create the file
    if (!this.fileItem.id) {
      const { fileItem } = await this.uploadToCloud(localSnapshot);
      return {
        mergedLastModified: localSnapshot.lastModified,
        fileItem,
      };
    }

    const { hasLocalChanges, mergedData } = await this.downloadFromCloud(localSnapshot);

    // Only upload if we have local changes that are newer than remote
    if (hasLocalChanges) {
      const { fileItem } = await this.uploadToCloud(mergedData);
      return { mergedLastModified: mergedData.lastModified, fileItem };
    }

    // No local changes - data is in sync

    return {
      mergedLastModified: mergedData.lastModified,
      fileItem: this.fileItem,
    };
  }
}
