import { db, syncMetadata } from '../db/database';
import { StorageService } from './storage/StorageService';
import type { DataFile, ExchangeRate } from '../types/models';
import { CurrencyCode } from '../types/enums';

export interface CloudSyncCallbacks {
  onSyncStart?: () => void;
  onSyncComplete?: (timestamp: string) => void;
  onSyncError?: (error: Error) => void;
}

/**
 * Cloud Sync Service with Last-Write-Wins strategy
 * Manages syncing data between IndexedDB and cloud storage
 */
export class CloudSyncService {
  private storageService: StorageService;
  private lastSyncTime: number = 0;
  private isSyncing = false;
  private throttleTimeoutId: NodeJS.Timeout | null = null;
  private hasPendingChanges = false;
  private readonly THROTTLE_MS = 60000; // 1 minute - guaranteed sync interval
  private callbacks: CloudSyncCallbacks = {};

  constructor(storageService: StorageService, callbacks?: CloudSyncCallbacks) {
    this.storageService = storageService;
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  setCallbacks(callbacks: CloudSyncCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Upload current IndexedDB data to cloud (Last-Write-Wins)
   */
  async uploadToCloud(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.callbacks.onSyncStart?.();

    try {
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

      await this.storageService.save(dataFile);
      const timestamp = new Date().toISOString();
      await syncMetadata.setLastSynced(timestamp);
      this.callbacks.onSyncComplete?.(timestamp);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Sync failed');
      this.callbacks.onSyncError?.(err);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Download from cloud and merge with local data (Last-Write-Wins)
   */
  async downloadFromCloud(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.callbacks.onSyncStart?.();

    try {
      const cloudData = await this.storageService.load();
      if (!cloudData) {
        throw new Error('No data file found in cloud');
      }

      // Merge with local data using Last-Write-Wins
      await this.mergeData(cloudData);
      const timestamp = new Date().toISOString();
      await syncMetadata.setLastSynced(timestamp);
      this.callbacks.onSyncComplete?.(timestamp);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Sync failed');
      this.callbacks.onSyncError?.(err);
      throw error;
    } finally {
      this.isSyncing = false;
    }
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
   * Throttled sync - uploads at most once per minute
   * Guarantees a sync will happen either now (if enough time passed) or after the throttle period
   * IndexedDB already persists data locally, so no data loss risk
   */
  throttledSync(): void {
    const now = Date.now();
    const timeSinceLastSync = now - this.lastSyncTime;

    // If enough time has passed, sync now
    if (timeSinceLastSync >= this.THROTTLE_MS) {
      this.lastSyncTime = now;
      // Clear any pending sync
      if (this.throttleTimeoutId) {
        clearTimeout(this.throttleTimeoutId);
        this.throttleTimeoutId = null;
      }
      this.hasPendingChanges = false;
      this.uploadToCloud().catch((error) => {
        console.error('Throttled sync failed:', error);
      });
    } else if (!this.throttleTimeoutId) {
      // Not enough time passed, schedule a sync for later
      const delay = this.THROTTLE_MS - timeSinceLastSync;
      this.hasPendingChanges = true;
      this.throttleTimeoutId = setTimeout(() => {
        this.throttleTimeoutId = null;
        this.lastSyncTime = Date.now();
        this.hasPendingChanges = false;
        this.uploadToCloud().catch((error) => {
          console.error('Throttled sync failed:', error);
        });
      }, delay);
    }
    // Otherwise, a sync is already scheduled, do nothing
  }

  /**
   * Full bidirectional sync
   * Downloads from cloud, merges, then uploads
   */
  async fullSync(): Promise<void> {
    await this.downloadFromCloud();
    await this.uploadToCloud();
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

  /**
   * Check if sync is in progress
   */
  get syncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Check if there are pending changes waiting to sync
   */
  get pendingChanges(): boolean {
    return this.hasPendingChanges;
  }
}

// Export singleton instance (initialized in App.tsx)
let cloudSyncService: CloudSyncService | null = null;

export function initCloudSyncService(
  storageService: StorageService,
  callbacks?: CloudSyncCallbacks
): CloudSyncService {
  cloudSyncService = new CloudSyncService(storageService, callbacks);
  return cloudSyncService;
}

export function getCloudSyncService(): CloudSyncService {
  if (!cloudSyncService) {
    throw new Error('CloudSyncService not initialized. Call initCloudSyncService first.');
  }
  return cloudSyncService;
}
