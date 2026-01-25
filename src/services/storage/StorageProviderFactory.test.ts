import { StorageProviderFactory, StorageProviderType } from './StorageProviderFactory';
import { OneDriveProvider } from './OneDriveProvider';
import { GoogleDriveProvider } from './GoogleDriveProvider';
import type { DataFile } from '../../types/models';

// Mock the storage providers
jest.mock('./OneDriveProvider');
jest.mock('./GoogleDriveProvider');

const STORAGE_CONFIG_KEY = 'moneyTree.storageProviderConfig';

describe('StorageProviderFactory', () => {
  let mockOnReconnectNeeded: jest.Mock;
  let mockOneDriveProvider: jest.Mocked<OneDriveProvider>;
  let mockGoogleDriveProvider: jest.Mocked<GoogleDriveProvider>;

  const mockDataFile: DataFile = {
    version: '1.0',
    lastModified: new Date().toISOString(),
    baseCurrency: 'USD',
    accounts: [],
    transactionTypes: [],
    categories: [],
    transactions: [],
    budgets: [],
    manualAssets: [],
    exchangeRates: [],
    archivedYears: [],
  };

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Setup mock reconnect callback
    mockOnReconnectNeeded = jest.fn().mockResolvedValue('reconnect');

    // Setup mock providers
    mockOneDriveProvider = {
      initialize: jest.fn().mockResolvedValue(true),
      authenticate: jest.fn().mockResolvedValue(undefined),
      readMainFile: jest.fn().mockResolvedValue(JSON.stringify(mockDataFile)),
      writeMainFile: jest.fn().mockResolvedValue(undefined),
      saveAdditionalFile: jest.fn().mockResolvedValue(undefined),
      getMainFileName: jest.fn().mockReturnValue('test.json'),
      getName: jest.fn().mockReturnValue('OneDrive'),
      clearCache: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockGoogleDriveProvider = {
      initialize: jest.fn().mockResolvedValue(true),
      authenticate: jest.fn().mockResolvedValue(undefined),
      readMainFile: jest.fn().mockResolvedValue(JSON.stringify(mockDataFile)),
      writeMainFile: jest.fn().mockResolvedValue(undefined),
      saveAdditionalFile: jest.fn().mockResolvedValue(undefined),
      getMainFileName: jest.fn().mockReturnValue('test.json'),
      getName: jest.fn().mockReturnValue('Google Drive'),
      clearCache: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock provider constructors
    (OneDriveProvider as jest.Mock).mockImplementation(() => mockOneDriveProvider);
    (GoogleDriveProvider as jest.Mock).mockImplementation(() => mockGoogleDriveProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should return null when no config is saved', async () => {
      const result = await StorageProviderFactory.initialize(mockOnReconnectNeeded);
      expect(result).toBeNull();
    });

    it('should restore cached ONEDRIVE connection', async () => {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({ type: 'onedrive' }));

      const result = await StorageProviderFactory.initialize(mockOnReconnectNeeded);

      expect(result).not.toBeNull();
      expect(result?.type).toBe(StorageProviderType.ONEDRIVE);
      expect(result?.provider).toBe(mockOneDriveProvider);
      expect(mockOneDriveProvider.initialize).toHaveBeenCalled();
    });

    it('should restore cached GOOGLE_DRIVE connection', async () => {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({ type: 'google_drive' }));

      const result = await StorageProviderFactory.initialize(mockOnReconnectNeeded);

      expect(result).not.toBeNull();
      expect(result?.type).toBe(StorageProviderType.GOOGLE_DRIVE);
      expect(result?.provider).toBe(mockGoogleDriveProvider);
      expect(mockGoogleDriveProvider.initialize).toHaveBeenCalled();
    });

    it('should return null when initialize fails', async () => {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({ type: 'onedrive' }));
      mockOneDriveProvider.initialize.mockResolvedValue(false);

      const result = await StorageProviderFactory.initialize(mockOnReconnectNeeded);

      expect(result).toBeNull();
    });

    it('should handle invalid config in localStorage', async () => {
      localStorage.setItem(STORAGE_CONFIG_KEY, 'invalid json');

      const result = await StorageProviderFactory.initialize(mockOnReconnectNeeded);

      expect(result).toBeNull();
    });
  });

  describe('connect', () => {
    it('should connect to ONEDRIVE provider and return result', async () => {
      const result = await StorageProviderFactory.connect({ type: StorageProviderType.ONEDRIVE });

      expect(result.type).toBe(StorageProviderType.ONEDRIVE);
      expect(result.provider).toBe(mockOneDriveProvider);
      expect(mockOneDriveProvider.authenticate).toHaveBeenCalled();
      // Verify config was saved
      const savedConfig = localStorage.getItem(STORAGE_CONFIG_KEY);
      expect(savedConfig).toBeTruthy();
      expect(JSON.parse(savedConfig!).type).toBe('onedrive');
    });

    it('should connect to GOOGLE_DRIVE provider and return result', async () => {
      const result = await StorageProviderFactory.connect({
        type: StorageProviderType.GOOGLE_DRIVE,
      });

      expect(result.type).toBe(StorageProviderType.GOOGLE_DRIVE);
      expect(result.provider).toBe(mockGoogleDriveProvider);
      expect(mockGoogleDriveProvider.authenticate).toHaveBeenCalled();
      // Verify config was saved
      const savedConfig = localStorage.getItem(STORAGE_CONFIG_KEY);
      expect(savedConfig).toBeTruthy();
      expect(JSON.parse(savedConfig!).type).toBe('google_drive');
    });
  });

  describe('disconnect', () => {
    it('should clear provider config cache', async () => {
      // Set up localStorage as if connected
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({ type: 'onedrive' }));
      expect(localStorage.getItem(STORAGE_CONFIG_KEY)).not.toBeNull();

      // Now disconnect - file cache is managed by SyncContext
      await StorageProviderFactory.disconnect(mockOneDriveProvider);

      // Verify only provider config is cleared
      expect(localStorage.getItem(STORAGE_CONFIG_KEY)).toBeNull();
    });

    it('should handle null provider', async () => {
      // Set up localStorage as if connected
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({ type: 'onedrive' }));
      expect(localStorage.getItem(STORAGE_CONFIG_KEY)).not.toBeNull();

      // Disconnect with null provider
      await StorageProviderFactory.disconnect(null);

      // Should still clear localStorage even with null provider
      expect(localStorage.getItem(STORAGE_CONFIG_KEY)).toBeNull();
    });
  });
});
