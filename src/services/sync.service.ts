import { useAppStore } from '../stores/useAppStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useAssetStore } from '../stores/useAssetStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useExchangeRateStore } from '../stores/useExchangeRateStore';
import { StorageFactory } from './storage/StorageFactory';
import type { DataFile } from '../types/models';
import { calculateDataFileHash } from '../utils/hash.utils';
import { performThreeWayMerge, Conflict, MergeResult } from './merge.service';
import { ConflictResolution } from '../components/common/MergePreviewDialog';

const AUTO_SAVE_INTERVAL = 1 * 60 * 1000; // 1 minute in milliseconds

type MergeHandler = (mergeResult: MergeResult) => Promise<ConflictResolution[] | null>;

/**
 * Check if an error is related to authentication/permission issues
 */
function isAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('permission') ||
    message.includes('authenticate') ||
    message.includes('auth') ||
    message.includes('expired') ||
    message.includes('denied') ||
    message.includes('401') ||
    message.includes('403')
  );
}

class SyncService {
  private autoSaveTimerId: NodeJS.Timeout | null = null;
  private isSaving = false;
  private mergeHandler: MergeHandler | null = null;

  /**
   * Check if there are unsaved changes and prompt user if needed
   * Returns true if it's safe to proceed, false if user cancelled
   */
  async promptSaveIfNeeded(): Promise<boolean> {
    const state = useAppStore.getState();

    if (!state.hasUnsavedChanges) {
      return true;
    }

    const shouldSave = window.confirm(
      'You have unsaved changes. Would you like to save before continuing?'
    );

    if (shouldSave) {
      try {
        await this.syncNow();
        return true;
      } catch (error) {
        console.error('Failed to sync:', error);
        const proceedAnyway = window.confirm(
          'Failed to sync. Do you want to continue without syncing? Your changes will be lost.'
        );
        return proceedAnyway;
      }
    }

    return true;
  }

  /**
   * Apply conflict resolutions chosen by the user
   */
  private applyConflictResolutions(
    mergedData: DataFile,
    conflicts: Conflict[],
    resolutions: ConflictResolution[]
  ): DataFile {
    const result = structuredClone(mergedData);

    // Create a map of resolutions for quick lookup
    const resolutionMap = new Map(resolutions.map((r) => [r.conflictIndex, r.resolution]));

    conflicts.forEach((conflict, index) => {
      const resolution = resolutionMap.get(index);
      if (!resolution) return;

      const chosenVersion = resolution === 'file' ? conflict.fileVersion : conflict.appVersion;

      // If user chose to delete (null version), skip adding it
      if (chosenVersion === null) return;

      // Apply resolution based on entity type
      switch (conflict.type) {
        case 'account':
          if (!result.accounts) result.accounts = [];
          // Remove existing if present
          result.accounts = result.accounts.filter((a) => a.id !== conflict.entityId);
          // Add chosen version
          result.accounts.push(chosenVersion as any);
          break;

        case 'category':
          if (!result.categories) result.categories = [];
          result.categories = result.categories.filter((c) => c.id !== conflict.entityId);
          result.categories.push(chosenVersion as any);
          break;

        case 'transactionType':
          if (!result.transactionTypes) result.transactionTypes = [];
          result.transactionTypes = result.transactionTypes.filter(
            (t) => t.id !== conflict.entityId
          );
          result.transactionTypes.push(chosenVersion as any);
          break;

        case 'transaction':
          if (!result.transactions) result.transactions = [];
          result.transactions = result.transactions.filter((t) => t.id !== conflict.entityId);
          result.transactions.push(chosenVersion as any);
          break;

        case 'asset':
          if (!result.manualAssets) result.manualAssets = [];
          result.manualAssets = result.manualAssets.filter((a) => a.id !== conflict.entityId);
          result.manualAssets.push(chosenVersion as any);
          break;

        case 'budget':
          if (!result.budgets) result.budgets = [];
          result.budgets = result.budgets.filter((b) => b.id !== conflict.entityId);
          result.budgets.push(chosenVersion as any);
          break;
      }
    });

    return result;
  }

  /**
   * Set the merge handler callback
   * This allows the UI to handle merge conflicts
   */
  setMergeHandler(handler: MergeHandler | null): void {
    this.mergeHandler = handler;
  }

  /**
   * Sync data immediately
   * Saves current state to storage provider
   * @param background - If true, won't show blocking loading screen (used for auto-save)
   */
  async syncNow(background: boolean = false): Promise<void> {
    if (this.isSaving) {
      return;
    }

    const state = useAppStore.getState();

    if (!state.hasUnsavedChanges) {
      return;
    }

    this.isSaving = true;
    // Only show blocking loading screen for user-initiated syncs
    if (!background) {
      state.setLoading(true);
    }

    try {
      const storage = StorageFactory.getCurrentProvider();

      // Gather data from all domain stores to create app version
      const accountStore = useAccountStore.getState();
      const categoryStore = useCategoryStore.getState();
      const transactionStore = useTransactionStore.getState();
      const assetStore = useAssetStore.getState();
      const budgetStore = useBudgetStore.getState();
      const exchangeRateStore = useExchangeRateStore.getState();

      const appVersion: DataFile = structuredClone({
        version: '1.0.0',
        transactions: transactionStore.transactions,
        budgets: budgetStore.budgets,
        manualAssets: assetStore.manualAssets,
        exchangeRates: exchangeRateStore.rates,
        accounts: accountStore.accounts,
        categories: categoryStore.categories,
        transactionTypes: categoryStore.transactionTypes,
        archivedYears: state.archivedYears,
        baseCurrency: state.baseCurrency,
        lastModified: state.baseVersion?.lastModified || new Date().toISOString(),
        lastBackupDate: state.lastBackupDate || undefined,
      });

      let dataToSave = appVersion;
      if (state.fileContentHash && state.baseVersion) {
        try {
          // Re-read current file content
          const currentFileData = await storage.loadDataFile();

          if (currentFileData) {
            // Calculate current file hash
            const currentHash = await calculateDataFileHash(currentFileData);

            // If hashes differ, file was modified externally
            if (currentHash !== state.fileContentHash) {
              // Perform three-way merge
              const mergeResult = performThreeWayMerge(
                state.baseVersion,
                currentFileData,
                appVersion
              );

              if (mergeResult.conflicts.length > 0 && this.mergeHandler) {
                // There are conflicts, ask user to resolve them
                const resolutions = await this.mergeHandler(mergeResult);

                if (!resolutions) {
                  // User cancelled the merge
                  this.isSaving = false;
                  // Only clear loading if we set it (not in background)
                  if (!background) {
                    state.setLoading(false);
                  }
                  return;
                }

                // Apply user resolutions to conflicts
                dataToSave = this.applyConflictResolutions(
                  mergeResult.merged,
                  mergeResult.conflicts,
                  resolutions
                );
              } else if (mergeResult.conflicts.length > 0) {
                // No merge handler available, show warning
                state.showSnackbar(
                  'File was modified externally but no merge handler available',
                  'warning'
                );
              } else {
                // No conflicts, use auto-merged result
                dataToSave = mergeResult.merged;
                state.showSnackbar(
                  `Auto-merged ${mergeResult.autoMergedCount} changes successfully`,
                  'success'
                );
              }
            }
          }
        } catch (error) {
          // If we can't read file (deleted, permission error), log and continue
          console.error('Error checking for conflicts:', error);
          // Continue with save attempt using appVersion
        }
      }

      await storage.saveDataFile(dataToSave);

      // Update file hash and base version after successful save
      const newHash = await calculateDataFileHash(dataToSave);
      const savedAt = new Date().toISOString();
      state.setFileMetadata(newHash, savedAt, dataToSave);

      state.markAsSaved();
      // Get the actual filename from storage provider
      const fileName = storage.getFileName();
      state.setFileName(fileName);
      state.setError(null);
      state.showSnackbar('Data saved successfully', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync';
      state.setError(message);
      state.showSnackbar(`Failed to save: ${message}`, 'error');
      throw error;
    } finally {
      this.isSaving = false;
      // Only clear loading state if we set it
      if (!background) {
        state.setLoading(false);
      }
    }
  }

  /**
   * Start periodic auto-save
   * Auto-save only runs when there are unsaved changes
   */
  startAutoSave(): void {
    this.stopAutoSave();

    this.autoSaveTimerId = setInterval(async () => {
      const state = useAppStore.getState();

      if (state.hasUnsavedChanges && !this.isSaving) {
        try {
          // Pass true for background sync to avoid blocking UI
          await this.syncNow(true);
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    }, AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop periodic auto-save
   */
  stopAutoSave(): void {
    if (this.autoSaveTimerId) {
      clearInterval(this.autoSaveTimerId);
      this.autoSaveTimerId = null;
    }
  }

  /**
   * Load data file for a specific year
   */
  async loadDataFile(): Promise<void> {
    const state = useAppStore.getState();
    state.setLoading(true);
    state.setError(null);

    try {
      const storage = StorageFactory.getCurrentProvider();
      const dataFile = await storage.loadDataFile();

      if (dataFile) {
        // Store archived years in app state
        state.setArchivedYears(dataFile.archivedYears || []);

        // Store last backup date in app state
        state.setLastBackupDate(dataFile.lastBackupDate || null);

        // Calculate and store file hash for conflict detection
        const fileHash = await calculateDataFileHash(dataFile);
        const loadedAt = new Date().toISOString();
        state.setFileMetadata(fileHash, loadedAt, structuredClone(dataFile));

        // Distribute data to domain stores
        useAccountStore.getState().setAccounts(dataFile.accounts || []);
        useCategoryStore.getState().setCategories(dataFile.categories || []);
        useCategoryStore.getState().setTransactionTypes(dataFile.transactionTypes || []);
        useTransactionStore.getState().setTransactions(dataFile.transactions || []);
        useAssetStore.getState().setManualAssets(dataFile.manualAssets || []);
        useBudgetStore.getState().setBudgets(dataFile.budgets || []);
        useExchangeRateStore.getState().setRates(dataFile.exchangeRates || []);

        // Load base currency from data file (schema provides default if not present)
        state.setBaseCurrency(dataFile.baseCurrency);

        // Get the actual filename from storage provider
        const fileName = storage.getFileName();
        state.setFileName(fileName);
        state.markAsSaved();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load file';
      state.setError(message);
      throw error;
    } finally {
      state.setLoading(false);
    }
  }

  /**
   * Attempt to auto-load from cached file handle or authenticated cloud provider
   * Returns true if successful, false if no cached file or load failed
   */
  async autoLoad(): Promise<boolean> {
    const state = useAppStore.getState();

    try {
      // Try to load file from provider (initialization happens in constructor)
      await this.loadDataFile();
      return true;
    } catch (error) {
      const providerType = StorageFactory.getProviderType();

      // Check if this is an authentication/permission error
      if (isAuthError(error)) {
        const providerName =
          providerType === 'onedrive'
            ? 'OneDrive'
            : providerType === 'google_drive'
              ? 'Google Drive'
              : providerType === 'dropbox'
                ? 'Dropbox'
                : 'cloud storage';

        // Set error message to inform user
        const errorMessage = `Failed to load file: File permission expired. Please go to Settings → Data & Sync to reconnect your ${providerName} account.`;
        state.setError(errorMessage);
        state.showSnackbar(errorMessage, 'error');

        console.error('Authentication error during auto-load:', error);
        return false;
      }

      // For other errors (file not found, network issues), fail silently
      // User will see Welcome Dialog
      console.info('Auto-load failed:', error);
      return false;
    }
  }

  /**
   * Reset all data and redirect to welcome dialog
   * Clears all stores and cached data, user will need to reconnect on next visit
   */
  async resetToWelcome(): Promise<void> {
    // Clear all provider caches and disconnect services
    await StorageFactory.clearCache();

    // Clear all domain stores
    useAccountStore.getState().setAccounts([]);
    useCategoryStore.getState().setCategories([]);
    useCategoryStore.getState().setTransactionTypes([]);
    useTransactionStore.getState().setTransactions([]);
    useAssetStore.getState().setManualAssets([]);
    useBudgetStore.getState().setBudgets([]);
    useExchangeRateStore.getState().resetRates();

    // Reset app state
    const state = useAppStore.getState();
    state.setFileName(null);
    state.markAsSaved();
  }

  /**
   * Mark changes as made (to trigger auto-save timer)
   */
  markChanged(): void {
    const state = useAppStore.getState();
    state.setUnsavedChanges(true);
  }
}

export const syncService = new SyncService();
