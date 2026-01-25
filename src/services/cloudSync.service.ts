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
   */
  async downloadFromCloud(): Promise<string> {
    const blob = await this.provider.readFile(this.fileItem);
    const content = await blob.text();
    const cloudData = JSON.parse(content) as DataFile;
    if (!cloudData) {
      throw new Error('No data file found in cloud');
    }

    // Merge with local data using Last-Write-Wins
    await this.mergeData(cloudData);
    const timestamp = new Date().toISOString();
    await syncMetadata.setLastSynced(timestamp);
    return timestamp;
  }

  /**
   * Merge cloud data with local data using Last-Write-Wins strategy
   */
  private async mergeData(cloudData: DataFile): Promise<void> {
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
    const mergedTransactions = this.mergeByTimestamp(localTransactions, cloudData.transactions);
    const mergedAccounts = this.mergeByTimestamp(localAccounts, cloudData.accounts);
    const mergedCategories = this.mergeByTimestamp(localCategories, cloudData.categories);
    const mergedTransactionTypes = this.mergeByTimestamp(
      localTransactionTypes,
      cloudData.transactionTypes
    );
    const mergedBudgets = this.mergeByTimestamp(localBudgets, cloudData.budgets);
    const mergedAssets = this.mergeByTimestamp(localAssets, cloudData.manualAssets);
    // Exchange rates don't have updatedAt, so just merge by ID
    const mergedExchangeRates = this.mergeExchangeRates(
      localExchangeRates,
      cloudData.exchangeRates
    );

    // Update IndexedDB with merged data
    await Promise.all([
      db.transactions.bulkPut(mergedTransactions),
      db.accounts.bulkPut(mergedAccounts),
      db.categories.bulkPut(mergedCategories),
      db.transactionTypes.bulkPut(mergedTransactionTypes),
      db.budgets.bulkPut(mergedBudgets),
      db.manualAssets.bulkPut(mergedAssets),
      db.exchangeRates.bulkPut(mergedExchangeRates),
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
  }

  /**
   * Merge two arrays using Last-Write-Wins strategy
   * Items with newer updatedAt timestamp win
   */
  private mergeByTimestamp<T extends { id: string; updatedAt: string }>(
    local: T[],
    remote: T[]
  ): T[] {
    const map = new Map<string, T>();

    // Add all local items
    local.forEach((item) => map.set(item.id, item));

    // Replace with remote if remote is newer
    remote.forEach((item) => {
      const existing = map.get(item.id);
      if (!existing || item.updatedAt > existing.updatedAt) {
        map.set(item.id, item);
      }
    });

    return Array.from(map.values());
  }

  /**
   * Merge exchange rates by ID (no timestamp)
   */
  private mergeExchangeRates(local: ExchangeRate[], remote: ExchangeRate[]): ExchangeRate[] {
    const map = new Map<string, ExchangeRate>();

    // Add all local items
    local.forEach((item) => map.set(item.id, item));

    // Add/replace with remote items
    remote.forEach((item) => {
      map.set(item.id, item);
    });

    return Array.from(map.values());
  }

  /**
   * Full bidirectional sync
   * Downloads from cloud, merges, then uploads
   * Returns updated CloudItem from upload
   */
  async fullSync(): Promise<{
    downloadTimestamp: string;
    uploadTimestamp: string;
    fileItem: CloudItem;
  }> {
    const downloadTimestamp = await this.downloadFromCloud();
    const { timestamp: uploadTimestamp, fileItem } = await this.uploadToCloud();
    return { downloadTimestamp, uploadTimestamp, fileItem };
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
