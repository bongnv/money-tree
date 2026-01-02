import { syncService } from './sync.service';
import { useAppStore } from '../stores/useAppStore';
import { useAccountStore } from '../stores/useAccountStore';
import { StorageFactory } from './storage/StorageFactory';
import type { DataFile } from '../types/models';
import { AccountType } from '../types/enums';

jest.mock('./storage/StorageFactory');

describe('SyncService', () => {
  let mockSaveDataFile: jest.Mock;
  let mockLoadDataFile: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.getState().resetState();
    // Reset account store by setting accounts to empty
    useAccountStore.setState({ accounts: [] });

    mockSaveDataFile = jest.fn();
    mockLoadDataFile = jest.fn();

    (StorageFactory.getCurrentProvider as jest.Mock).mockReturnValue({
      saveDataFile: mockSaveDataFile,
      loadDataFile: mockLoadDataFile,
      listAvailableYears: jest.fn(),
    });

    jest.spyOn(window, 'confirm').mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    syncService.stopAutoSave();
  });

  describe('promptSaveIfNeeded', () => {
    it('should return true when there are no unsaved changes', async () => {
      const result = await syncService.promptSaveIfNeeded();
      expect(result).toBe(true);
      expect(window.confirm).not.toHaveBeenCalled();
    });

    it('should prompt user when there are unsaved changes', async () => {
      // Add some data to domain stores to trigger save
      useAccountStore.getState().addAccount({
        id: '1',
        name: 'Test Account',
        type: AccountType.CASH,
        currencyId: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      useAppStore.getState().setUnsavedChanges(true);

      await syncService.promptSaveIfNeeded();

      expect(window.confirm).toHaveBeenCalledWith(
        'You have unsaved changes. Would you like to save before continuing?'
      );
    });

    it('should save and return true when user confirms', async () => {
      useAccountStore.getState().addAccount({
        id: '1',
        name: 'Test Account',
        type: AccountType.CASH,
        currencyId: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      useAppStore.getState().setUnsavedChanges(true);

      (window.confirm as jest.Mock).mockReturnValue(true);
      mockSaveDataFile.mockResolvedValue(undefined);

      const result = await syncService.promptSaveIfNeeded();

      expect(result).toBe(true);
      expect(mockSaveDataFile).toHaveBeenCalled();
    });

    it('should return true when user cancels', async () => {
      useAccountStore.getState().addAccount({
        id: '1',
        name: 'Test Account',
        type: AccountType.CASH,
        currencyId: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      useAppStore.getState().setUnsavedChanges(true);

      (window.confirm as jest.Mock).mockReturnValue(false);

      const result = await syncService.promptSaveIfNeeded();

      expect(result).toBe(true);
      expect(mockSaveDataFile).not.toHaveBeenCalled();
    });
  });

  describe('saveNow', () => {
    it('should save data file', async () => {
      useAccountStore.getState().addAccount({
        id: '1',
        name: 'Test Account',
        type: AccountType.CASH,
        currencyId: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      useAppStore.getState().setCurrentYear(2024);
      useAppStore.getState().setUnsavedChanges(true);

      mockSaveDataFile.mockResolvedValue(undefined);

      await syncService.saveNow();

      expect(mockSaveDataFile).toHaveBeenCalledWith(
        2024,
        expect.objectContaining({
          version: '1.0.0',
          year: 2024,
        })
      );

      expect(useAppStore.getState().hasUnsavedChanges).toBe(false);
    });

    it('should save empty data file when no domain data', async () => {
      useAppStore.getState().setCurrentYear(2024);
      useAppStore.getState().setUnsavedChanges(true);
      mockSaveDataFile.mockResolvedValue(undefined);

      await syncService.saveNow();

      expect(mockSaveDataFile).toHaveBeenCalledWith(
        2024,
        expect.objectContaining({
          version: '1.0.0',
          year: 2024,
          accounts: [],
        })
      );
    });

    it('should not save when no unsaved changes', async () => {
      useAccountStore.getState().addAccount({
        id: '1',
        name: 'Test Account',
        type: AccountType.CASH,
        currencyId: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      useAppStore.getState().setCurrentYear(2024);
      useAppStore.getState().setUnsavedChanges(false);

      await syncService.saveNow();

      expect(mockSaveDataFile).not.toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      useAccountStore.getState().addAccount({
        id: '1',
        name: 'Test Account',
        type: AccountType.CASH,
        currencyId: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      useAppStore.getState().setCurrentYear(2024);
      useAppStore.getState().setUnsavedChanges(true);

      mockSaveDataFile.mockRejectedValue(new Error('Save failed'));

      await expect(syncService.saveNow()).rejects.toThrow('Save failed');
      expect(useAppStore.getState().error).toBe('Save failed');
    });
  });

  describe('loadDataFile', () => {
    it('should load data file', async () => {
      const mockDataFile: DataFile = {
        version: '1.0.0',
        year: 2024,
        accounts: [{
          id: '1',
          name: 'Test Account',
          type: AccountType.CASH,
          currencyId: 'USD',
          initialBalance: 1000,
          isActive: true,
          description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        }],
        categories: [],
        transactionTypes: [],
        transactions: [],
        manualAssets: [],
        budgets: [],
        lastModified: new Date().toISOString(),
      };

      mockLoadDataFile.mockResolvedValue(mockDataFile);

      await syncService.loadDataFile(2024);

      expect(mockLoadDataFile).toHaveBeenCalledWith(2024);
      expect(useAccountStore.getState().accounts).toHaveLength(1);
      expect(useAccountStore.getState().accounts[0].name).toBe('Test Account');
      expect(useAppStore.getState().currentYear).toBe(2024);
      expect(useAppStore.getState().hasUnsavedChanges).toBe(false);
    });

    it('should handle load errors', async () => {
      mockLoadDataFile.mockRejectedValue(new Error('Load failed'));

      await expect(syncService.loadDataFile(2024)).rejects.toThrow('Load failed');
      expect(useAppStore.getState().error).toBe('Load failed');
    });

    it('should handle cancelled load', async () => {
      mockLoadDataFile.mockResolvedValue(null);

      await syncService.loadDataFile(2024);

      // Should not throw and should not modify stores
      expect(useAccountStore.getState().accounts).toHaveLength(0);
    });
  });

  describe('auto-save', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start and stop auto-save', () => {
      syncService.startAutoSave();
      syncService.stopAutoSave();
      // No error should be thrown
      expect(true).toBe(true);
    });

    it('should auto-save when changes are detected', async () => {
      useAccountStore.getState().addAccount({
        id: '1',
        name: 'Test Account',
        type: AccountType.CASH,
        currencyId: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      useAppStore.getState().setCurrentYear(2024);
      useAppStore.getState().setUnsavedChanges(true);

      mockSaveDataFile.mockResolvedValue(undefined);

      syncService.startAutoSave();

      // Fast-forward 5 minutes
      jest.advanceTimersByTime(5 * 60 * 1000);

      // Wait for async operations
      await Promise.resolve();

      expect(mockSaveDataFile).toHaveBeenCalled();
    });

    it('should not auto-save when no changes', async () => {
      useAccountStore.getState().addAccount({
        id: '1',
        name: 'Test Account',
        type: AccountType.CASH,
        currencyId: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      useAppStore.getState().setCurrentYear(2024);
      useAppStore.getState().setUnsavedChanges(false);

      syncService.startAutoSave();

      // Fast-forward 5 minutes
      jest.advanceTimersByTime(5 * 60 * 1000);

      await Promise.resolve();

      expect(mockSaveDataFile).not.toHaveBeenCalled();
    });
  });

  describe('markChanged', () => {
    it('should mark changes', () => {
      syncService.markChanged();
      expect(useAppStore.getState().hasUnsavedChanges).toBe(true);
    });
  });
});

