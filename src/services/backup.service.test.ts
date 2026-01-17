/**
 * BackupService Tests
 */

import { BackupService } from './backup.service';
import { useAppStore } from '../stores/useAppStore';
import { StorageService } from './storage/StorageService';
import type { DataFile } from '../types/models';
import { CurrencyCode } from '../types/enums';

// Mock dependencies
jest.mock('fflate', () => ({
  strToU8: jest.fn((str: string) => new Uint8Array(Buffer.from(str))),
  gzipSync: jest.fn(() => new Uint8Array([31, 139, 8, 0])), // Mock gzip signature
}));

describe('BackupService', () => {
  let backupService: BackupService;
  let mockProvider: { saveAdditionalFile: jest.Mock };
  let mockStorageService: jest.Mocked<StorageService>;
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
    baseCurrency: CurrencyCode.USD,
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create fresh mocks
    mockProvider = {
      saveAdditionalFile: jest.fn().mockResolvedValue(undefined),
    };

    mockStorageService = {
      fileName: 'test-file.json',
      providerName: 'Local File',
      provider: mockProvider,
      currentProvider: mockProvider,
      saveFile: jest.fn(async (data: string | Blob, filename: string) => {
        await mockProvider.saveAdditionalFile(filename, data);
      }),
      loadDataFile: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    // Create new BackupService instance with mock storageService
    backupService = new BackupService(mockStorageService);

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
    beforeEach(() => {
      // Reset mock functions
      (mockStorageService.saveFile as jest.Mock).mockReset().mockResolvedValue(undefined);
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

      // Verify saveFile was called with Blob and filename
      expect(mockStorageService.saveFile).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/^money-tree-backup-\d{4}-\d{2}-\d{2}-\d{6}\.gz$/)
      );
      expect(useAppStore.getState().setLastBackupDate).toHaveBeenCalledWith(expect.any(String));
      expect(useAppStore.getState().setUnsavedChanges).toHaveBeenCalledWith(true);
    });

    it('should throw error when saveFile fails', async () => {
      useAppStore.setState({ baseVersion: mockDataFile });
      mockStorageService.saveFile.mockRejectedValueOnce(new Error('Save failed'));

      await expect(backupService.saveBackupToStorage()).rejects.toThrow(
        'Failed to save backup: Save failed'
      );
    });

    it('should re-throw error when user cancels', async () => {
      useAppStore.setState({ baseVersion: mockDataFile });
      mockStorageService.saveFile.mockRejectedValueOnce(new Error('File save cancelled'));

      await expect(backupService.saveBackupToStorage()).rejects.toThrow('File save cancelled');
    });

    it('should generate filename with correct format', async () => {
      useAppStore.setState({ baseVersion: mockDataFile });

      await backupService.saveBackupToStorage();

      const callArgs = mockStorageService.saveFile.mock.calls[0];
      const filename = callArgs[1]; // filename is second argument

      expect(filename).toMatch(/^money-tree-backup-\d{4}-\d{2}-\d{2}-\d{6}\.gz$/);
    });

    it('should backup baseVersion not current state', async () => {
      const baseVersion = { ...mockDataFile, lastModified: '2024-01-01T00:00:00.000Z' };
      useAppStore.setState({ baseVersion });

      await backupService.saveBackupToStorage();

      expect(mockStorageService.saveFile).toHaveBeenCalled();
      // Verify gzipSync was used and converted to Blob
      expect(mockStorageService.saveFile).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.any(String)
      );
    });
  });
});
