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
      initialize: jest.fn().mockResolvedValue(undefined),
      getFileName: jest.fn().mockReturnValue('test.json'),
      getName: jest.fn().mockReturnValue('Test Provider'),
      saveFile: jest.fn().mockResolvedValue(undefined),
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
        currencyCode: 'USD',
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
        currencyCode: 'USD',
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
        currencyCode: 'USD',
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

  describe('syncNow', () => {
    it('should sync data file', async () => {
      useAccountStore.getState().addAccount({
        id: '1',
        name: 'Test Account',
        type: AccountType.CASH,
        currencyCode: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      useAppStore.getState().setUnsavedChanges(true);

      mockLoadDataFile.mockResolvedValue(null);
      mockSaveDataFile.mockResolvedValue(undefined);

      await syncService.syncNow();

      expect(mockSaveDataFile).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '1.0.0',
          transactions: expect.any(Array),
          budgets: expect.any(Array),
          manualAssets: expect.any(Array),
          exchangeRates: expect.any(Array),
        })
      );

      expect(useAppStore.getState().hasUnsavedChanges).toBe(false);
    });

    it('should sync empty data file when no domain data', async () => {
      useAppStore.getState().setUnsavedChanges(true);
      mockLoadDataFile.mockResolvedValue(null);
      mockSaveDataFile.mockResolvedValue(undefined);

      await syncService.syncNow();

      expect(mockSaveDataFile).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '1.0.0',
          accounts: [],
          transactions: [],
          budgets: [],
          manualAssets: [],
          exchangeRates: [],
        })
      );
    });

    it('should not sync when no unsaved changes', async () => {
      useAccountStore.getState().addAccount({
        id: '1',
        name: 'Test Account',
        type: AccountType.CASH,
        currencyCode: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      useAppStore.getState().setUnsavedChanges(false);

      await syncService.syncNow();

      expect(mockSaveDataFile).not.toHaveBeenCalled();
    });

    it('should handle sync errors', async () => {
      useAccountStore.getState().addAccount({
        id: '1',
        name: 'Test Account',
        type: AccountType.CASH,
        currencyCode: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      useAppStore.getState().setUnsavedChanges(true);

      mockSaveDataFile.mockRejectedValue(new Error('Sync failed'));

      await expect(syncService.syncNow()).rejects.toThrow('Sync failed');
      expect(useAppStore.getState().error).toBe('Sync failed');
    });

    it('should not show loading screen for background sync', async () => {
      useAccountStore.getState().addAccount({
        id: '1',
        name: 'Test Account',
        type: AccountType.CASH,
        currencyCode: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      useAppStore.getState().setUnsavedChanges(true);

      mockLoadDataFile.mockResolvedValue(null);
      mockSaveDataFile.mockResolvedValue(undefined);

      // Track loading state changes
      const loadingStates: boolean[] = [];
      const unsubscribe = useAppStore.subscribe((state) => {
        loadingStates.push(state.isLoading);
      });

      await syncService.syncNow(true); // background = true

      unsubscribe();

      // Should never set loading to true during background sync
      expect(loadingStates.every((state) => state === false)).toBe(true);
      expect(useAppStore.getState().hasUnsavedChanges).toBe(false);
    });

    it('should show loading screen for foreground sync', async () => {
      useAccountStore.getState().addAccount({
        id: '1',
        name: 'Test Account',
        type: AccountType.CASH,
        currencyCode: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      useAppStore.getState().setUnsavedChanges(true);

      mockLoadDataFile.mockResolvedValue(null);
      mockSaveDataFile.mockResolvedValue(undefined);

      // Track loading state changes
      const loadingStates: boolean[] = [];
      const unsubscribe = useAppStore.subscribe((state) => {
        loadingStates.push(state.isLoading);
      });

      await syncService.syncNow(false); // background = false (or default)

      unsubscribe();

      // Should set loading to true during foreground sync
      expect(loadingStates).toContain(true);
      expect(useAppStore.getState().hasUnsavedChanges).toBe(false);
    });
  });

  describe('loadDataFile', () => {
    it('should load data file', async () => {
      const mockDataFile: DataFile = {
        version: '1.0.0',
        transactions: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        accounts: [
          {
            id: '1',
            name: 'Test Account',
            type: AccountType.CASH,
            currencyCode: 'USD',
            initialBalance: 1000,
            isActive: true,
            description: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        categories: [],
        transactionTypes: [],
        archivedYears: [],
        lastModified: new Date().toISOString(),
      };

      mockLoadDataFile.mockResolvedValue(mockDataFile);

      await syncService.loadDataFile();

      expect(mockLoadDataFile).toHaveBeenCalled();
      expect(useAccountStore.getState().accounts).toHaveLength(1);
      expect(useAccountStore.getState().accounts[0].name).toBe('Test Account');
      expect(useAppStore.getState().hasUnsavedChanges).toBe(false);
    });

    it('should handle load errors', async () => {
      mockLoadDataFile.mockRejectedValue(new Error('Load failed'));

      await expect(syncService.loadDataFile()).rejects.toThrow('Load failed');
      expect(useAppStore.getState().error).toBe('Load failed');
    });

    it('should handle cancelled load', async () => {
      mockLoadDataFile.mockResolvedValue(null);

      await syncService.loadDataFile();

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
        currencyCode: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
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
        currencyCode: 'USD',
        initialBalance: 1000,
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
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

  describe('autoLoad', () => {
    it('should return true when load succeeds', async () => {
      const mockInitialize = jest.fn().mockResolvedValue(undefined);
      const mockDataFile: DataFile = {
        version: '1.0.0',
        transactions: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        accounts: [],
        categories: [],
        transactionTypes: [],
        archivedYears: [],
        lastModified: new Date().toISOString(),
      };

      (StorageFactory.getCurrentProvider as jest.Mock).mockReturnValue({
        saveDataFile: mockSaveDataFile,
        loadDataFile: mockLoadDataFile.mockResolvedValue(mockDataFile),
        getFileName: jest.fn().mockReturnValue('test.json'),
        getName: jest.fn().mockReturnValue('Test Provider'),
        saveFile: jest.fn().mockResolvedValue(undefined),
      });

      const result = await syncService.autoLoad();

      expect(result).toBe(true);
      expect(mockLoadDataFile).toHaveBeenCalled();
    });

    it('should return false when load fails', async () => {
      (StorageFactory.getCurrentProvider as jest.Mock).mockReturnValue({
        saveDataFile: mockSaveDataFile,
        loadDataFile: mockLoadDataFile.mockRejectedValue(new Error('Load failed')),
        getFileName: jest.fn().mockReturnValue('test.json'),
        getName: jest.fn().mockReturnValue('Test Provider'),
        saveFile: jest.fn().mockResolvedValue(undefined),
      });

      const result = await syncService.autoLoad();

      expect(result).toBe(false);
      expect(mockLoadDataFile).toHaveBeenCalled();
    });
  });
});
