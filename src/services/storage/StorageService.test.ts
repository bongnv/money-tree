import { StorageService, StorageProviderType } from './StorageService';
import { LocalStorageProvider } from './LocalStorageProvider';
import { OneDriveProvider } from './OneDriveProvider';
import { GoogleDriveProvider } from './GoogleDriveProvider';
import type { DataFile } from '../../types/models';

// Mock the storage providers
jest.mock('./LocalStorageProvider');
jest.mock('./OneDriveProvider');
jest.mock('./GoogleDriveProvider');

describe('StorageService', () => {
  let storageService: StorageService;
  let mockOnReconnectNeeded: jest.Mock;
  let mockLocalProvider: jest.Mocked<LocalStorageProvider>;
  let mockOneDriveProvider: jest.Mocked<OneDriveProvider>;
  let mockGoogleDriveProvider: jest.Mocked<GoogleDriveProvider>;

  const mockDataFile: DataFile = {
    version: '1.0.0',
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

    // Create storage service
    storageService = new StorageService(mockOnReconnectNeeded);

    // Setup mock providers
    mockLocalProvider = {
      initialize: jest.fn().mockResolvedValue(true),
      authenticate: jest.fn().mockResolvedValue(undefined),
      readMainFile: jest.fn().mockResolvedValue(JSON.stringify(mockDataFile)),
      writeMainFile: jest.fn().mockResolvedValue(undefined),
      saveAdditionalFile: jest.fn().mockResolvedValue(undefined),
      getMainFileName: jest.fn().mockReturnValue('test.json'),
      getName: jest.fn().mockReturnValue('Local Storage'),
      clearCache: jest.fn().mockResolvedValue(undefined),
    } as any;

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

    (LocalStorageProvider as jest.Mock).mockImplementation(() => mockLocalProvider);
    (OneDriveProvider as jest.Mock).mockImplementation(() => mockOneDriveProvider);
    (GoogleDriveProvider as jest.Mock).mockImplementation(() => mockGoogleDriveProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should return false when no config is saved', async () => {
      const result = await storageService.initialize();
      expect(result).toBe(false);
    });

    it('should restore cached LOCAL connection', async () => {
      localStorage.setItem(
        'moneyTree.storageProviderConfig',
        JSON.stringify({ type: StorageProviderType.LOCAL })
      );

      const result = await storageService.initialize();

      expect(result).toBe(true);
      expect(mockLocalProvider.initialize).toHaveBeenCalled();
      expect(storageService.providerName).toBe('Local Storage');
      expect(storageService.fileName).toBe('test.json');
    });

    it('should restore cached ONEDRIVE connection', async () => {
      localStorage.setItem(
        'moneyTree.storageProviderConfig',
        JSON.stringify({ type: StorageProviderType.ONEDRIVE })
      );

      const result = await storageService.initialize();

      expect(result).toBe(true);
      expect(mockOneDriveProvider.initialize).toHaveBeenCalled();
      expect(storageService.providerName).toBe('OneDrive');
    });

    it('should restore cached GOOGLE_DRIVE connection', async () => {
      localStorage.setItem(
        'moneyTree.storageProviderConfig',
        JSON.stringify({ type: StorageProviderType.GOOGLE_DRIVE })
      );

      const result = await storageService.initialize();

      expect(result).toBe(true);
      expect(mockGoogleDriveProvider.initialize).toHaveBeenCalled();
      expect(storageService.providerName).toBe('Google Drive');
    });

    it('should handle reconnection when provider initialize fails but file exists', async () => {
      localStorage.setItem(
        'moneyTree.storageProviderConfig',
        JSON.stringify({ type: StorageProviderType.ONEDRIVE })
      );

      // First initialize fails, but file exists
      mockOneDriveProvider.initialize.mockResolvedValueOnce(false);
      mockOneDriveProvider.getMainFileName.mockReturnValue('test.json');

      const result = await storageService.initialize();

      expect(result).toBe(true);
      expect(mockOnReconnectNeeded).toHaveBeenCalledWith('OneDrive');
      expect(mockOneDriveProvider.authenticate).toHaveBeenCalled();
      expect(mockOneDriveProvider.initialize).toHaveBeenCalledTimes(2);
    });

    it('should clear cache when user dismisses reconnection', async () => {
      localStorage.setItem(
        'moneyTree.storageProviderConfig',
        JSON.stringify({ type: StorageProviderType.ONEDRIVE })
      );

      mockOneDriveProvider.initialize.mockResolvedValueOnce(false);
      mockOneDriveProvider.getMainFileName.mockReturnValue('test.json');
      mockOnReconnectNeeded.mockResolvedValue('dismiss');

      const result = await storageService.initialize();

      expect(result).toBe(false);
      expect(mockOnReconnectNeeded).toHaveBeenCalledWith('OneDrive');
      expect(localStorage.getItem('moneyTree.storageProviderConfig')).toBeNull();
    });

    it('should clear cache when reconnection fails', async () => {
      localStorage.setItem(
        'moneyTree.storageProviderConfig',
        JSON.stringify({ type: StorageProviderType.ONEDRIVE })
      );

      mockOneDriveProvider.initialize
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);
      mockOneDriveProvider.getMainFileName.mockReturnValue('test.json');
      mockOneDriveProvider.authenticate.mockRejectedValue(new Error('Auth failed'));

      const result = await storageService.initialize();

      expect(result).toBe(false);
      expect(localStorage.getItem('moneyTree.storageProviderConfig')).toBeNull();
    });

    it('should handle invalid config in localStorage', async () => {
      localStorage.setItem('moneyTree.storageProviderConfig', 'invalid json');

      const result = await storageService.initialize();

      expect(result).toBe(false);
    });

    it('should handle initialization errors', async () => {
      localStorage.setItem(
        'moneyTree.storageProviderConfig',
        JSON.stringify({ type: StorageProviderType.LOCAL })
      );

      mockLocalProvider.initialize.mockRejectedValue(new Error('Init failed'));

      const result = await storageService.initialize();

      expect(result).toBe(false);
      expect(localStorage.getItem('moneyTree.storageProviderConfig')).toBeNull();
    });
  });

  describe('connect', () => {
    it('should connect to LOCAL provider', async () => {
      await storageService.connect({ type: StorageProviderType.LOCAL });

      expect(mockLocalProvider.authenticate).toHaveBeenCalled();
      expect(storageService.providerName).toBe('Local Storage');
      expect(localStorage.getItem('moneyTree.storageProviderConfig')).toBe(
        JSON.stringify({ type: StorageProviderType.LOCAL })
      );
    });

    it('should connect to ONEDRIVE provider', async () => {
      await storageService.connect({ type: StorageProviderType.ONEDRIVE });

      expect(mockOneDriveProvider.authenticate).toHaveBeenCalled();
      expect(storageService.providerName).toBe('OneDrive');
    });

    it('should connect to GOOGLE_DRIVE provider', async () => {
      await storageService.connect({ type: StorageProviderType.GOOGLE_DRIVE });

      expect(mockGoogleDriveProvider.authenticate).toHaveBeenCalled();
      expect(storageService.providerName).toBe('Google Drive');
    });

    it('should throw error for invalid provider type', async () => {
      await expect(storageService.connect({ type: 'invalid' as any })).rejects.toThrow(
        'Provider not available: invalid'
      );
    });
  });

  describe('disconnect', () => {
    it('should disconnect current provider and clear cache', async () => {
      await storageService.connect({ type: StorageProviderType.LOCAL });
      await storageService.disconnect();

      expect(mockLocalProvider.clearCache).toHaveBeenCalled();
      expect(storageService.providerName).toBeNull();
      expect(storageService.fileName).toBeNull();
      expect(localStorage.getItem('moneyTree.storageProviderConfig')).toBeNull();
    });

    it('should handle disconnect when no provider is connected', async () => {
      await storageService.disconnect();
      expect(storageService.providerName).toBeNull();
    });
  });

  describe('loadDataFile', () => {
    beforeEach(async () => {
      await storageService.connect({ type: StorageProviderType.LOCAL });
    });

    it('should load and parse data file', async () => {
      const data = await storageService.loadDataFile();

      expect(mockLocalProvider.readMainFile).toHaveBeenCalled();
      expect(data).toEqual(mockDataFile);
    });

    it('should throw error when not connected', async () => {
      await storageService.disconnect();

      await expect(storageService.loadDataFile()).rejects.toThrow(
        'No storage provider connected. Please select a file first.'
      );
    });

    it('should throw error for invalid JSON', async () => {
      mockLocalProvider.readMainFile.mockResolvedValue('invalid json');

      await expect(storageService.loadDataFile()).rejects.toThrow(
        'Failed to parse data file: invalid JSON'
      );
    });

    it('should throw error for invalid schema', async () => {
      mockLocalProvider.readMainFile.mockResolvedValue(JSON.stringify({ invalid: 'data' }));

      await expect(storageService.loadDataFile()).rejects.toThrow('Invalid data file format:');
    });

    it('should handle auth errors with reconnection', async () => {
      mockLocalProvider.readMainFile
        .mockRejectedValueOnce(new Error('401 unauthorized'))
        .mockResolvedValueOnce(JSON.stringify(mockDataFile));

      const data = await storageService.loadDataFile();

      expect(mockOnReconnectNeeded).toHaveBeenCalledWith('Local Storage');
      expect(mockLocalProvider.authenticate).toHaveBeenCalled();
      expect(mockLocalProvider.readMainFile).toHaveBeenCalledTimes(2);
      expect(data).toEqual(mockDataFile);
    });

    it('should handle user canceling reconnection', async () => {
      mockLocalProvider.readMainFile.mockRejectedValue(new Error('auth expired'));
      mockOnReconnectNeeded.mockResolvedValue('dismiss');

      await expect(storageService.loadDataFile()).rejects.toThrow('User cancelled reconnection');
    });

    it('should handle failed reconnection attempt', async () => {
      mockLocalProvider.readMainFile.mockRejectedValue(new Error('permission denied'));
      mockLocalProvider.authenticate.mockRejectedValue(new Error('Auth failed'));

      await expect(storageService.loadDataFile()).rejects.toThrow(
        'Failed to load data after reconnection: Auth failed'
      );
    });

    it('should re-throw non-auth errors', async () => {
      mockLocalProvider.readMainFile.mockRejectedValue(new Error('Network error'));

      await expect(storageService.loadDataFile()).rejects.toThrow('Network error');
      expect(mockOnReconnectNeeded).not.toHaveBeenCalled();
    });
  });

  describe('saveDataFile', () => {
    beforeEach(async () => {
      await storageService.connect({ type: StorageProviderType.LOCAL });
    });

    it('should save data file', async () => {
      await storageService.saveDataFile(mockDataFile);

      expect(mockLocalProvider.writeMainFile).toHaveBeenCalledWith(
        JSON.stringify(mockDataFile)
      );
    });

    it('should throw error when not connected', async () => {
      await storageService.disconnect();

      await expect(storageService.saveDataFile(mockDataFile)).rejects.toThrow(
        'No storage provider connected. Please select a file first.'
      );
    });
  });

  describe('saveFile', () => {
    beforeEach(async () => {
      await storageService.connect({ type: StorageProviderType.LOCAL });
    });

    it('should save string data to additional file', async () => {
      const data = 'test data';
      const filename = 'test.txt';

      await storageService.saveFile(data, filename);

      expect(mockLocalProvider.saveAdditionalFile).toHaveBeenCalledWith(filename, data);
    });

    it('should save Blob data to additional file', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const filename = 'test.blob';

      await storageService.saveFile(blob, filename);

      expect(mockLocalProvider.saveAdditionalFile).toHaveBeenCalledWith(filename, blob);
    });

    it('should throw error when not connected', async () => {
      await storageService.disconnect();

      await expect(storageService.saveFile('data', 'file.txt')).rejects.toThrow(
        'No storage provider connected. Please select a file first.'
      );
    });
  });

  describe('fileName getter', () => {
    it('should return null when no provider is connected', () => {
      expect(storageService.fileName).toBeNull();
    });

    it('should return file name from connected provider', async () => {
      await storageService.connect({ type: StorageProviderType.LOCAL });
      expect(storageService.fileName).toBe('test.json');
    });
  });

  describe('providerName getter', () => {
    it('should return null when no provider is connected', () => {
      expect(storageService.providerName).toBeNull();
    });

    it('should return provider name from connected provider', async () => {
      await storageService.connect({ type: StorageProviderType.LOCAL });
      expect(storageService.providerName).toBe('Local Storage');
    });
  });

  describe('provider getter', () => {
    it('should return null when no provider is connected', () => {
      expect(storageService.provider).toBeNull();
    });

    it('should return provider instance when connected', async () => {
      await storageService.connect({ type: StorageProviderType.LOCAL });
      expect(storageService.provider).toBe(mockLocalProvider);
    });
  });
});
