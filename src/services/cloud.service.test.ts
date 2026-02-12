import * as oneDriveConfig from '@/config/onedrive.config';
import { CloudService } from './cloud.service';
import { StorageProviderType } from './storage/IStorageProvider';
import { OneDriveProvider } from './storage/OneDriveProvider';

// Mock dependencies
jest.mock('./storage/OneDriveProvider');
jest.mock('@/config/onedrive.config', () => ({
  isOneDriveConfigured: jest.fn(),
}));

const mockOneDriveProvider = OneDriveProvider as jest.MockedClass<typeof OneDriveProvider>;
const mockIsOneDriveConfigured = oneDriveConfig.isOneDriveConfigured as jest.MockedFunction<
  typeof oneDriveConfig.isOneDriveConfigured
>;

describe('CloudService', () => {
  let cloudService: CloudService;
  let mockProvider: jest.Mocked<OneDriveProvider>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorage.clear();

    // Create mock provider instance
    mockProvider = {
      initialize: jest.fn().mockResolvedValue(undefined),
      authenticate: jest.fn().mockResolvedValue(undefined),
      isAuthenticated: jest.fn().mockResolvedValue(true),
      listItems: jest.fn().mockResolvedValue([]),
      readFile: jest.fn().mockResolvedValue(new Blob()),
      writeFile: jest.fn().mockResolvedValue({ id: 'file1', name: 'test.json', isFolder: false }),
      getType: jest.fn().mockReturnValue(StorageProviderType.ONEDRIVE),
    } as unknown as jest.Mocked<OneDriveProvider>;

    mockOneDriveProvider.mockImplementation(() => mockProvider);
    mockIsOneDriveConfigured.mockReturnValue(true);

    cloudService = new CloudService();
  });

  describe('initialize', () => {
    it('should do nothing when no provider is cached', async () => {
      await cloudService.initialize();

      expect(localStorage.getItem('moneyTree.storageProviderConfig')).toBeNull();
      expect(mockOneDriveProvider).not.toHaveBeenCalled();
    });

    it('should initialize cached provider', async () => {
      localStorage.setItem('moneyTree.storageProviderConfig', StorageProviderType.ONEDRIVE);

      await cloudService.initialize();

      expect(mockOneDriveProvider).toHaveBeenCalled();
      expect(mockProvider.initialize).toHaveBeenCalled();
      expect(cloudService.getCurrentProvider()).toBe(StorageProviderType.ONEDRIVE);
    });

    it('should clear invalid cache when provider is not configured', async () => {
      localStorage.setItem('moneyTree.storageProviderConfig', StorageProviderType.ONEDRIVE);
      mockIsOneDriveConfigured.mockReturnValue(false);

      await cloudService.initialize();

      expect(localStorage.getItem('moneyTree.storageProviderConfig')).toBeNull();
      expect(cloudService.getCurrentProvider()).toBeNull();
    });

    it('should store provider even if not authenticated', async () => {
      localStorage.setItem('moneyTree.storageProviderConfig', StorageProviderType.ONEDRIVE);
      mockProvider.isAuthenticated.mockResolvedValue(false);

      await cloudService.initialize();

      expect(cloudService.getCurrentProvider()).toBe(StorageProviderType.ONEDRIVE);
    });
  });

  describe('connect', () => {
    it('should connect to OneDrive provider', async () => {
      await cloudService.connect(StorageProviderType.ONEDRIVE);

      expect(mockOneDriveProvider).toHaveBeenCalled();
      expect(mockProvider.authenticate).toHaveBeenCalled();
      expect(localStorage.getItem('moneyTree.storageProviderConfig')).toBe(
        StorageProviderType.ONEDRIVE
      );
      expect(cloudService.getCurrentProvider()).toBe(StorageProviderType.ONEDRIVE);
    });

    it('should throw error when provider is not available', async () => {
      mockIsOneDriveConfigured.mockReturnValue(false);

      await expect(cloudService.connect(StorageProviderType.ONEDRIVE)).rejects.toThrow(
        'Provider not available: onedrive'
      );
    });

    it('should save config before authentication', async () => {
      let savedConfigBeforeAuth = false;
      mockProvider.authenticate.mockImplementation(async () => {
        savedConfigBeforeAuth = localStorage.getItem('moneyTree.storageProviderConfig') !== null;
      });

      await cloudService.connect(StorageProviderType.ONEDRIVE);

      expect(savedConfigBeforeAuth).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should clear provider and config', async () => {
      await cloudService.connect(StorageProviderType.ONEDRIVE);
      expect(cloudService.getCurrentProvider()).toBe(StorageProviderType.ONEDRIVE);

      await cloudService.disconnect();

      expect(cloudService.getCurrentProvider()).toBeNull();
      expect(localStorage.getItem('moneyTree.storageProviderConfig')).toBeNull();
    });
  });

  describe('reconnect', () => {
    it('should re-authenticate with current provider', async () => {
      await cloudService.connect(StorageProviderType.ONEDRIVE);
      mockProvider.authenticate.mockClear();

      await cloudService.reconnect();

      expect(mockProvider.authenticate).toHaveBeenCalled();
    });

    it('should throw error when no provider is active', async () => {
      await expect(cloudService.reconnect()).rejects.toThrow('No active cloud provider');
    });
  });

  describe('listFiles', () => {
    it('should list files from provider', async () => {
      const mockFiles = [
        { id: '1', name: 'file1.json', isFolder: false },
        { id: '2', name: 'folder1', isFolder: true },
      ];
      mockProvider.listItems.mockResolvedValue(mockFiles);

      await cloudService.connect(StorageProviderType.ONEDRIVE);
      const files = await cloudService.listFiles();

      expect(mockProvider.listItems).toHaveBeenCalledWith(undefined);
      expect(files).toEqual(mockFiles);
    });

    it('should list files with parent folder', async () => {
      const parentFolder = { id: '2', name: 'folder1', isFolder: true };
      const mockFiles = [{ id: '3', name: 'file2.json', isFolder: false }];
      mockProvider.listItems.mockResolvedValue(mockFiles);

      await cloudService.connect(StorageProviderType.ONEDRIVE);
      const files = await cloudService.listFiles(parentFolder);

      expect(mockProvider.listItems).toHaveBeenCalledWith(parentFolder);
      expect(files).toEqual(mockFiles);
    });

    it('should throw error when no provider is active', async () => {
      await expect(cloudService.listFiles()).rejects.toThrow('No active cloud provider');
    });
  });

  describe('readFile', () => {
    it('should read file from provider', async () => {
      const fileItem = { id: '1', name: 'test.json', isFolder: false };
      const mockBlob = new Blob(['test content']);
      mockProvider.readFile.mockResolvedValue(mockBlob);

      await cloudService.connect(StorageProviderType.ONEDRIVE);
      const content = await cloudService.readFile(fileItem);

      expect(mockProvider.readFile).toHaveBeenCalledWith(fileItem);
      expect(content).toBe(mockBlob);
    });

    it('should throw error when no provider is active', async () => {
      const fileItem = { id: '1', name: 'test.json', isFolder: false };
      await expect(cloudService.readFile(fileItem)).rejects.toThrow('No active cloud provider');
    });
  });

  describe('writeFile', () => {
    it('should write file to provider', async () => {
      const fileItem = { id: '1', name: 'test.json', isFolder: false };
      const content = new Blob(['test content']);
      const updatedItem = { id: '1', name: 'test.json', isFolder: false };
      mockProvider.writeFile.mockResolvedValue(updatedItem);

      await cloudService.connect(StorageProviderType.ONEDRIVE);
      const result = await cloudService.writeFile(fileItem, content);

      expect(mockProvider.writeFile).toHaveBeenCalledWith(fileItem, content);
      expect(result).toBe(updatedItem);
    });

    it('should throw error when no provider is active', async () => {
      const fileItem = { id: '1', name: 'test.json', isFolder: false };
      const content = new Blob(['test content']);
      await expect(cloudService.writeFile(fileItem, content)).rejects.toThrow(
        'No active cloud provider'
      );
    });
  });

  describe('getCurrentProvider', () => {
    it('should return null when no provider is active', () => {
      expect(cloudService.getCurrentProvider()).toBeNull();
    });

    it('should return provider type when provider is active', async () => {
      await cloudService.connect(StorageProviderType.ONEDRIVE);
      expect(cloudService.getCurrentProvider()).toBe(StorageProviderType.ONEDRIVE);
    });
  });

  describe('getProviderName', () => {
    it('should return null when no provider is active', () => {
      expect(cloudService.getProviderName()).toBeNull();
    });

    it('should return OneDrive name for OneDrive provider', async () => {
      await cloudService.connect(StorageProviderType.ONEDRIVE);
      expect(cloudService.getProviderName()).toBe('OneDrive');
    });

    it('should return Cloud for unknown provider type', async () => {
      await cloudService.connect(StorageProviderType.ONEDRIVE);
      mockProvider.getType.mockReturnValue('unknown' as StorageProviderType);
      expect(cloudService.getProviderName()).toBe('Cloud');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no provider is active', async () => {
      expect(await cloudService.isAuthenticated()).toBe(false);
    });

    it('should return true when provider is authenticated', async () => {
      mockProvider.isAuthenticated.mockResolvedValue(true);
      await cloudService.connect(StorageProviderType.ONEDRIVE);

      expect(await cloudService.isAuthenticated()).toBe(true);
    });

    it('should return false when provider is not authenticated', async () => {
      mockProvider.isAuthenticated.mockResolvedValue(false);
      await cloudService.connect(StorageProviderType.ONEDRIVE);

      expect(await cloudService.isAuthenticated()).toBe(false);
    });
  });
});
