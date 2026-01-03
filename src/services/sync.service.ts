import { useAppStore } from '../stores/useAppStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useAssetStore } from '../stores/useAssetStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { StorageFactory } from './storage/StorageFactory';
import type { DataFile } from '../types/models';

const AUTO_SAVE_INTERVAL = 1 * 60 * 1000; // 1 minute in milliseconds

class SyncService {
  private autoSaveTimerId: NodeJS.Timeout | null = null;
  private isSaving = false;

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
   * Sync data immediately
   * Saves current state to storage provider
   */
  async syncNow(): Promise<void> {
    if (this.isSaving) {
      return;
    }

    const state = useAppStore.getState();

    if (!state.hasUnsavedChanges) {
      return;
    }

    this.isSaving = true;
    state.setLoading(true);

    try {
      const storage = StorageFactory.getCurrentProvider();

      // Gather data from all domain stores
      const accountStore = useAccountStore.getState();
      const categoryStore = useCategoryStore.getState();
      const transactionStore = useTransactionStore.getState();
      const assetStore = useAssetStore.getState();
      const budgetStore = useBudgetStore.getState();

      // Get existing data file from storage or create new one
      let existingData: DataFile | null = null;

      try {
        existingData = await storage.loadDataFile();
      } catch (error) {
        // If file doesn't exist, we'll create a new one
      }

      const currentYearStr = String(state.currentYear);

      const dataToSave: DataFile = {
        version: '1.0.0',
        years: {
          ...existingData?.years,
          [currentYearStr]: {
            transactions: transactionStore.transactions,
            budgets: budgetStore.budgets,
            manualAssets: assetStore.manualAssets,
          },
        },
        accounts: accountStore.accounts,
        categories: categoryStore.categories,
        transactionTypes: categoryStore.transactionTypes,
        archivedYears: existingData?.archivedYears || [],
        lastModified: new Date().toISOString(),
      };

      await storage.saveDataFile(dataToSave);

      state.markAsSaved();
      // Get the actual filename from storage provider
      const fileName = storage.getFileName?.() || 'money-tree.json';
      state.setFileName(fileName);
      state.setError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync';
      state.setError(message);
      throw error;
    } finally {
      this.isSaving = false;
      state.setLoading(false);
    }
  }

  /**
   * @deprecated Use syncNow() instead
   */
  async saveNow(): Promise<void> {
    return this.syncNow();
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
          await this.syncNow();
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
  async loadDataFile(year: number): Promise<void> {
    const state = useAppStore.getState();
    state.setLoading(true);
    state.setError(null);

    try {
      const storage = StorageFactory.getCurrentProvider();
      const dataFile = await storage.loadDataFile();

      if (dataFile) {
        // Distribute shared data to domain stores
        useAccountStore.getState().setAccounts(dataFile.accounts || []);
        useCategoryStore.getState().setCategories(dataFile.categories || []);
        useCategoryStore.getState().setTransactionTypes(dataFile.transactionTypes || []);

        // Get year-specific data
        const yearStr = String(year);
        const yearData = dataFile.years?.[yearStr];

        if (yearData) {
          useTransactionStore.getState().setTransactions(yearData.transactions || []);
          useAssetStore.getState().setManualAssets(yearData.manualAssets || []);
          useBudgetStore.getState().setBudgets(yearData.budgets || []);
        } else {
          // No data for this year, initialize with empty arrays
          useTransactionStore.getState().setTransactions([]);
          useAssetStore.getState().setManualAssets([]);
          useBudgetStore.getState().setBudgets([]);
        }

        state.setCurrentYear(year);
        // Get the actual filename from storage provider
        const fileName = storage.getFileName?.() || 'money-tree.json';
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
   * Attempt to auto-load from cached file handle
   * Returns true if successful, false if no cached file or load failed
   */
  async autoLoad(): Promise<boolean> {
    try {
      const storage = StorageFactory.getCurrentProvider();

      // Ensure storage provider is initialized (important for LocalStorageProvider)
      if ('ensureInitialized' in storage && typeof storage.ensureInitialized === 'function') {
        await storage.ensureInitialized();
      }

      // Check if we have a cached file handle
      if (!storage.hasFileHandle || !storage.hasFileHandle()) {
        return false;
      }

      const state = useAppStore.getState();
      const currentYear = state.currentYear || new Date().getFullYear();

      // Try to load from cached handle
      await this.loadDataFile(currentYear);
      return true;
    } catch (error) {
      // Auto-load fails silently - user will see Welcome Dialog
      console.info('Auto-load failed:', error);
      return false;
    }
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
