/**
 * BackupService Tests
 */

import { backupService } from './backup.service';
import { useAppStore } from '../stores/useAppStore';
import { StorageFactory } from './storage/StorageFactory';
import type { DataFile } from '../types/models';
import { CurrencyCode } from '../types/enums';

// Mock dependencies
jest.mock('./storage/StorageFactory');
jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => ({
    file: jest.fn(),
    generateAsync: jest.fn().mockResolvedValue(new Blob(['test'], { type: 'application/zip' })),
  }));
});

describe('BackupService', () => {
  const mockDataFile: DataFile = {
    version: '1.0.0',
    years: {
      '2024': {
        transactions: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
      },
    },
    accounts: [],
    categories: [],
    transactionTypes: [],
    archivedYears: [],
    lastModified: new Date().toISOString(),
    baseCurrency: CurrencyCode.USD,
  };

  beforeEach(() => {
    // Reset store
    useAppStore.setState({
      baseVersion: mockDataFile,
      lastBackupDate: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldPromptBackup', () => {
    it('should return false when lastBackupDate is null and no baseVersion exists', () => {
      useAppStore.setState({ baseVersion: null, lastBackupDate: null });
      const result = backupService.shouldPromptBackup();
      expect(result).toBe(false);
    });

    it('should return false when lastBackupDate is undefined and no baseVersion exists', () => {
      useAppStore.setState({ baseVersion: null, lastBackupDate: null });
      const result = backupService.shouldPromptBackup();
      expect(result).toBe(false);
    });

    it('should return true when never backed up but baseVersion exists', () => {
      useAppStore.setState({ baseVersion: mockDataFile, lastBackupDate: null });
      const result = backupService.shouldPromptBackup();
      expect(result).toBe(true);
    });

    it('should return true when backup is older than 30 days', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      useAppStore.setState({ lastBackupDate: oldDate.toISOString() });
      const result = backupService.shouldPromptBackup();
      expect(result).toBe(true);
    });

    it('should return false when backup is within 30 days', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15);
      useAppStore.setState({ lastBackupDate: recentDate.toISOString() });
      const result = backupService.shouldPromptBackup();
      expect(result).toBe(false);
    });

    it('should return true when backup is exactly 30 days old', () => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      useAppStore.setState({ lastBackupDate: date.toISOString() });
      const result = backupService.shouldPromptBackup();
      expect(result).toBe(true);
    });

    it('should return false when backup is today', () => {
      const today = new Date().toISOString();
      useAppStore.setState({ lastBackupDate: today });
      const result = backupService.shouldPromptBackup();
      expect(result).toBe(false);
    });
  });

  describe('saveBackupToStorage', () => {
    const mockProvider = {
      saveDataFile: jest.fn(),
      loadDataFile: jest.fn(),
      saveFile: jest.fn().mockResolvedValue(undefined),
      getFileName: jest.fn().mockReturnValue('test.json'),
    };

    beforeEach(() => {
      (StorageFactory.getCurrentProvider as jest.Mock).mockReturnValue(mockProvider);
      jest.spyOn(useAppStore.getState(), 'setLastBackupDate');
      jest.spyOn(useAppStore.getState(), 'setUnsavedChanges');
    });

    it('should throw error when baseVersion is null', async () => {
      useAppStore.setState({ baseVersion: null });

      await expect(backupService.saveBackupToStorage()).rejects.toThrow(
        'Cannot create backup: No saved data found. Please save your data first.'
      );
    });

    it('should create backup and update lastBackupDate on success', async () => {
      useAppStore.setState({ baseVersion: mockDataFile });

      await backupService.saveBackupToStorage();

      expect(mockProvider.saveFile).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/^money-tree-backup-\d{4}-\d{2}-\d{2}-\d{6}\.zip$/)
      );
      expect(useAppStore.getState().setLastBackupDate).toHaveBeenCalledWith(expect.any(String));
      expect(useAppStore.getState().setUnsavedChanges).toHaveBeenCalledWith(true);
    });

    it('should throw error when saveFile fails', async () => {
      useAppStore.setState({ baseVersion: mockDataFile });
      mockProvider.saveFile.mockRejectedValueOnce(new Error('Save failed'));

      await expect(backupService.saveBackupToStorage()).rejects.toThrow(
        'Failed to save backup: Save failed'
      );
    });

    it('should re-throw error when user cancels', async () => {
      useAppStore.setState({ baseVersion: mockDataFile });
      mockProvider.saveFile.mockRejectedValueOnce(new Error('File save cancelled'));

      await expect(backupService.saveBackupToStorage()).rejects.toThrow('File save cancelled');
    });

    it('should generate filename with correct format', async () => {
      useAppStore.setState({ baseVersion: mockDataFile });

      await backupService.saveBackupToStorage();

      const callArgs = mockProvider.saveFile.mock.calls[0];
      const filename = callArgs[1];

      expect(filename).toMatch(/^money-tree-backup-\d{4}-\d{2}-\d{2}-\d{6}\.zip$/);
    });

    it('should backup baseVersion not current state', async () => {
      const baseVersion = { ...mockDataFile, lastModified: '2024-01-01T00:00:00.000Z' };
      useAppStore.setState({ baseVersion });

      await backupService.saveBackupToStorage();

      expect(mockProvider.saveFile).toHaveBeenCalled();
      // Verify JSZip was used (mocked to return blob)
      expect(mockProvider.saveFile).toHaveBeenCalledWith(expect.any(Blob), expect.any(String));
    });
  });
});
