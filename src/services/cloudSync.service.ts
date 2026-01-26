import { db, syncMetadata } from '../db/database';
import { IStorageProvider, CloudItem } from './storage/IStorageProvider';
import type { DataFile, ExchangeRate } from '../types/models';
import { CurrencyCode } from '../types/enums';

/**
 * Cloud Sync Service with Last-Write-Wins strategy
 * Stateless service that manages syncing data between IndexedDB and cloud storage
 * State management (file info) is handled by SyncProvider
 */
export class CloudSyncService {
  private provider: IStorageProvider;
  private fileItem: CloudItem;

  constructor(provider: IStorageProvider, fileItem: CloudItem) {
    this.provider = provider;
    this.fileItem = fileItem;
  }

  /**
   * Upload current IndexedDB data to cloud (Last-Write-Wins)
   * Returns updated CloudItem (may have new id if it was a new file)
   */
  async uploadToCloud(): Promise<{ timestamp: string; fileItem: CloudItem }> {
    // Gather all data from IndexedDB
    const [
      transactions,
      accounts,
      categories,
      transactionTypes,
      budgets,
      manualAssets,
      exchangeRates,
    ] = await Promise.all([
      db.transactions.toArray(),
      db.accounts.toArray(),
      db.categories.toArray(),
      db.transactionTypes.toArray(),
      db.budgets.toArray(),
      db.manualAssets.toArray(),
      db.exchangeRates.toArray(),
    ]);

    const baseCurrency =
      ((await syncMetadata.getBaseCurrency()) as CurrencyCode) || CurrencyCode.USD;
    const archivedYears = await syncMetadata.getArchivedYears();
    // Use existing lastModified timestamp, or create new one if it doesn't exist
    const lastModified = (await syncMetadata.getLastModified()) || new Date().toISOString();

    const dataFile: DataFile = {
      version: '1.0',
      transactions,
      accounts,
      categories,
      transactionTypes,
      budgets,
      manualAssets,
      exchangeRates,
      archivedYears,
      baseCurrency,
      lastModified,
    };

    const content = JSON.stringify(dataFile);
    const blob = new Blob([content], { type: 'application/json' });
    const updatedFileItem = await this.provider.writeFile(this.fileItem, blob);
    const timestamp = new Date().toISOString();
    return { timestamp, fileItem: updatedFileItem };
  }

  /**
   * Download from cloud and merge with local data (Last-Write-Wins)
   * Returns timestamp and whether local has newer changes
   */
  async downloadFromCloud(): Promise<{
    timestamp: string;
    hasLocalChanges: boolean;
  }> {
    const blob = await this.provider.readFile(this.fileItem);
    const content = await blob.text();
    const cloudData = JSON.parse(content) as DataFile;
    if (!cloudData) {
      throw new Error('No data file found in cloud');
    }

    // Merge with local data using Last-Write-Wins
    const hasLocalChanges = await this.mergeData(cloudData);
    const timestamp = new Date().toISOString();
    return { timestamp, hasLocalChanges };
  }

  /**
   * Merge cloud data with local data using Last-Write-Wins strategy
   * Returns flag indicating if local has newer changes
   */
  private async mergeData(cloudData: DataFile): Promise<boolean> {
    // Get local data
    const [
      localTransactions,
      localAccounts,
      localCategories,
      localTransactionTypes,
      localBudgets,
      localAssets,
      localExchangeRates,
    ] = await Promise.all([
      db.transactions.toArray(),
      db.accounts.toArray(),
      db.categories.toArray(),
      db.transactionTypes.toArray(),
      db.budgets.toArray(),
      db.manualAssets.toArray(),
      db.exchangeRates.toArray(),
    ]);

    // Merge each entity type using Last-Write-Wins
    const transactionsResult = this.mergeByTimestamp(localTransactions, cloudData.transactions);
    const accountsResult = this.mergeByTimestamp(localAccounts, cloudData.accounts);
    const categoriesResult = this.mergeByTimestamp(localCategories, cloudData.categories);
    const transactionTypesResult = this.mergeByTimestamp(
      localTransactionTypes,
      cloudData.transactionTypes
    );
    const budgetsResult = this.mergeByTimestamp(localBudgets, cloudData.budgets);
    const assetsResult = this.mergeByTimestamp(localAssets, cloudData.manualAssets);
    // Exchange rates don't have updatedAt, so just merge by ID
    const exchangeRatesResult = this.mergeExchangeRates(
      localExchangeRates,
      cloudData.exchangeRates
    );

    // Merge metadata using Last-Write-Wins
    const metadataResult = await this.mergeMetadata(cloudData);

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
      db.transactions.bulkPut(transactionsResult.merged),
      db.accounts.bulkPut(accountsResult.merged),
      db.categories.bulkPut(categoriesResult.merged),
      db.transactionTypes.bulkPut(transactionTypesResult.merged),
      db.budgets.bulkPut(budgetsResult.merged),
      db.manualAssets.bulkPut(assetsResult.merged),
      db.exchangeRates.bulkPut(exchangeRatesResult.merged),
    ]);

    return hasLocalChanges;
  }

  /**
   * Merge two arrays using Last-Write-Wins strategy
   * Items with newer updatedAt (or createdAt if updatedAt not available) timestamp win
   * Returns merged data and flag indicating if local has newer changes
   */
  private mergeByTimestamp<T extends { id: string; updatedAt?: string; createdAt: string }>(
    local: T[],
    remote: T[]
  ): { merged: T[]; hasLocalChanges: boolean } {
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
    local.forEach((item) => {
      const hasInRemote = remote.some((r) => r.id === item.id);
      if (!hasInRemote) {
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
   * Returns flag indicating if local metadata is newer
   */
  private async mergeMetadata(cloudData: DataFile): Promise<{ hasLocalChanges: boolean }> {
    const localLastModified = await syncMetadata.getLastModified();
    const cloudLastModified = cloudData.lastModified;

    // If cloud metadata is newer (or local has no lastModified), update from cloud
    if (!localLastModified || cloudLastModified > localLastModified) {
      await syncMetadata.setBaseCurrency(cloudData.baseCurrency);
      if (cloudData.archivedYears && cloudData.archivedYears.length > 0) {
        await syncMetadata.setArchivedYears(cloudData.archivedYears);
      }
      await syncMetadata.setLastModified(cloudLastModified);
      return { hasLocalChanges: false };
    } else if (localLastModified > cloudLastModified) {
      // Local metadata is newer
      return { hasLocalChanges: true };
    }

    // Equal timestamps - no changes
    return { hasLocalChanges: false };
  }

  /**
   * Full bidirectional sync
   * Downloads from cloud, merges, then uploads (only if local changes exist)
   * Optimized: skips upload if only remote changes were merged (nothing new to upload)
   * Returns updated CloudItem from upload
   */
  async fullSync(): Promise<{
    downloadTimestamp: string;
    uploadTimestamp: string;
    fileItem: CloudItem;
  }> {
    // If file doesn't have an ID yet, it's a new file that hasn't been uploaded
    // Skip download and upload directly to create the file
    if (!this.fileItem.id) {
      const { timestamp: uploadTimestamp, fileItem } = await this.uploadToCloud();
      return {
        downloadTimestamp: uploadTimestamp,
        uploadTimestamp,
        fileItem,
      };
    }

    const { timestamp: downloadTimestamp, hasLocalChanges } = await this.downloadFromCloud();

    // Only upload if we have local changes that are newer than remote
    if (hasLocalChanges) {
      const { timestamp: uploadTimestamp, fileItem } = await this.uploadToCloud();
      return { downloadTimestamp, uploadTimestamp, fileItem };
    }

    // No local changes - data is in sync
    return {
      downloadTimestamp,
      uploadTimestamp: downloadTimestamp,
      fileItem: this.fileItem,
    };
  }
}
