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
    const lastBackupDate = await syncMetadata.getLastBackupDate();
    const archivedYears = await syncMetadata.getArchivedYears();

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
      lastModified: new Date().toISOString(),
      lastBackupDate: lastBackupDate || undefined,
    };

    const content = JSON.stringify(dataFile);
    const blob = new Blob([content], { type: 'application/json' });
    const updatedFileItem = await this.provider.writeFile(this.fileItem, blob);
    const timestamp = new Date().toISOString();
    await syncMetadata.setLastSynced(timestamp);
    return { timestamp, fileItem: updatedFileItem };
  }

  /**
   * Download from cloud and merge with local data (Last-Write-Wins)
   * Returns timestamp and whether any remote changes were merged
   */
  async downloadFromCloud(): Promise<{ timestamp: string; hasRemoteChanges: boolean }> {
    const blob = await this.provider.readFile(this.fileItem);
    const content = await blob.text();
    const cloudData = JSON.parse(content) as DataFile;
    if (!cloudData) {
      throw new Error('No data file found in cloud');
    }

    // Merge with local data using Last-Write-Wins
    const hasRemoteChanges = await this.mergeData(cloudData);
    const timestamp = new Date().toISOString();
    await syncMetadata.setLastSynced(timestamp);
    return { timestamp, hasRemoteChanges };
  }

  /**
   * Merge cloud data with local data using Last-Write-Wins strategy
   * Returns true if any remote changes were merged into local database
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

    // Track if any remote changes were merged
    const hasRemoteChanges =
      transactionsResult.hasRemoteChanges ||
      accountsResult.hasRemoteChanges ||
      categoriesResult.hasRemoteChanges ||
      transactionTypesResult.hasRemoteChanges ||
      budgetsResult.hasRemoteChanges ||
      assetsResult.hasRemoteChanges ||
      exchangeRatesResult.hasRemoteChanges;

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

    // Update metadata - only if local doesn't have values
    const localBaseCurrency = await syncMetadata.getBaseCurrency();
    if (!localBaseCurrency) {
      await syncMetadata.setBaseCurrency(cloudData.baseCurrency);
    }
    if (cloudData.lastBackupDate) {
      await syncMetadata.setLastBackupDate(cloudData.lastBackupDate);
    }
    // Update archived years from cloud
    if (cloudData.archivedYears && cloudData.archivedYears.length > 0) {
      await syncMetadata.setArchivedYears(cloudData.archivedYears);
    }

    return hasRemoteChanges;
  }

  /**
   * Merge two arrays using Last-Write-Wins strategy
   * Items with newer updatedAt timestamp win
   * Returns merged data and flag indicating if any remote changes were applied
   */
  private mergeByTimestamp<T extends { id: string; updatedAt: string }>(
    local: T[],
    remote: T[]
  ): { merged: T[]; hasRemoteChanges: boolean } {
    const map = new Map<string, T>();
    let hasRemoteChanges = false;

    // Add all local items
    local.forEach((item) => map.set(item.id, item));

    // Replace with remote if remote is newer
    remote.forEach((item) => {
      const existing = map.get(item.id);
      if (!existing || item.updatedAt > existing.updatedAt) {
        map.set(item.id, item);
        hasRemoteChanges = true;
      }
    });

    return { merged: Array.from(map.values()), hasRemoteChanges };
  }

  /**
   * Merge exchange rates by ID (no timestamp)
   * Returns merged data and flag indicating if any remote changes were applied
   */
  private mergeExchangeRates(
    local: ExchangeRate[],
    remote: ExchangeRate[]
  ): { merged: ExchangeRate[]; hasRemoteChanges: boolean } {
    const map = new Map<string, ExchangeRate>();
    let hasRemoteChanges = false;

    // Add all local items
    local.forEach((item) => map.set(item.id, item));

    // Add/replace with remote items
    remote.forEach((item) => {
      const existing = map.get(item.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
        map.set(item.id, item);
        hasRemoteChanges = true;
      }
    });

    return { merged: Array.from(map.values()), hasRemoteChanges };
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
    const { timestamp: downloadTimestamp, hasRemoteChanges } = await this.downloadFromCloud();

    // Optimize: only upload if we had local changes (i.e., not just remote changes)
    // If only remote changes were merged, local is now in sync - no need to upload
    if (!hasRemoteChanges) {
      // Local data is newer or equal, upload to ensure cloud is up to date
      const { timestamp: uploadTimestamp, fileItem } = await this.uploadToCloud();
      return { downloadTimestamp, uploadTimestamp, fileItem };
    }

    // Only remote changes were merged, skip upload (we'd just upload what we downloaded)
    return {
      downloadTimestamp,
      uploadTimestamp: downloadTimestamp,
      fileItem: this.fileItem,
    };
  }

  /**
   * Load initial data from cloud into empty database
   */
  async loadInitialData(): Promise<void> {
    const count = await db.transactions.count();
    if (count > 0) {
      // Database already has data, skip initial load
      return;
    }

    await this.downloadFromCloud();
  }
}
