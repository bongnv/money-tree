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
        await this.saveNow();
        return true;
      } catch (error) {
        console.error('Failed to save:', error);
        const proceedAnyway = window.confirm(
          'Failed to save. Do you want to continue without saving? Your changes will be lost.'
        );
        return proceedAnyway;
      }
    }

    return true;
  }

  /**
   * Save data immediately
   */
  async saveNow(): Promise<void> {
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
      
      const dataToSave: DataFile = {
        version: '1.0.0',
        year: state.currentYear,
        accounts: accountStore.accounts,
        categories: categoryStore.categories,
        transactionTypes: categoryStore.transactionTypes,
        transactions: transactionStore.transactions,
        budgets: budgetStore.budgets,
        manualAssets: assetStore.manualAssets,
        lastModified: new Date().toISOString(),
      };

      await storage.saveDataFile(dataToSave.year, dataToSave);

      state.markAsSaved();
      state.setFileName(`money-tree-${dataToSave.year}.json`);
      state.setError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      state.setError(message);
      throw error;
    } finally {
      this.isSaving = false;
      state.setLoading(false);
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
          await this.saveNow();
        } catch (error) {
          console.error('Auto-save failed:', error);
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
      const dataFile = await storage.loadDataFile(year);

      if (dataFile) {
        // Distribute data to domain stores
        useAccountStore.getState().setAccounts(dataFile.accounts || []);
        useCategoryStore.getState().setCategories(dataFile.categories || []);
        useCategoryStore.getState().setTransactionTypes(dataFile.transactionTypes || []);
        useTransactionStore.getState().setTransactions(dataFile.transactions || []);
        useAssetStore.getState().setManualAssets(dataFile.manualAssets || []);
        useBudgetStore.getState().setBudgets(dataFile.budgets || []);
        
        state.setCurrentYear(year);
        state.setFileName(`money-tree-${year}.json`);
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
   * Mark changes as made (to trigger auto-save timer)
   */
  markChanged(): void {
    const state = useAppStore.getState();
    state.setUnsavedChanges(true);
  }
}

export const syncService = new SyncService();

