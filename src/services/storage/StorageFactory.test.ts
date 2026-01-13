import {
  StorageFactory,
  StorageProviderType,
  LocalStorageProvider,
  OneDriveProvider,
  OneDriveService,
} from './index';

// Mock OneDriveService
jest.mock('./OneDriveService');

/**
 * Tests for StorageFactory
 */
describe('StorageFactory', () => {
  let factory: StorageFactory;

  beforeEach(() => {
    // Create new instance for each test
    factory = new StorageFactory();
    // Clear localStorage
    localStorage.clear();
    // Clear mock
    jest.clearAllMocks();
  });

  describe('getCurrentProvider', () => {
    it('should throw error when no provider configured for LOCAL', () => {
      // Test expects error when trying to get Local provider without cached file
      expect(() => factory.getCurrentProvider()).toThrow('No storage provider configured');
    });

    it('should throw error when trying to configure ONEDRIVE without fileInfo', async () => {
      // When replaceProvider is called without required config, it should fail during createProvider
      await expect(factory.replaceProvider({ type: StorageProviderType.ONEDRIVE })).rejects.toThrow(
        'No cached file info found'
      );
    });
  });

  describe('provider name', () => {
    it('should throw when no provider configured', () => {
      expect(() => factory.getCurrentProvider().getName()).toThrow(
        'No storage provider configured'
      );
    });

    it('should return provider name after replaceProvider', async () => {
      const fileInfo = {
        fileId: 'test-id',
        filePath: '/test/path',
        fileName: 'test.json',
        isNew: false,
      };
      await factory.replaceProvider({
        type: StorageProviderType.ONEDRIVE,
        fileInfo,
      });
      expect(factory.getCurrentProvider().getName()).toBe('OneDrive');
    });

    it('should persist provider type in config', async () => {
      const fileInfo = {
        fileId: 'test-id',
        filePath: '/test/path',
        fileName: 'test.json',
        isNew: false,
      };
      await factory.replaceProvider({
        type: StorageProviderType.ONEDRIVE,
        fileInfo,
      });
      const saved = localStorage.getItem('moneyTree.storageProviderConfig');
      expect(saved).toBeTruthy();
      const config = JSON.parse(saved!);
      expect(config.type).toBe(StorageProviderType.ONEDRIVE);
    });
  });

  describe('replaceProvider', () => {
    it('should create LOCAL provider with fileHandle', async () => {
      const mockFileHandle = { name: 'test.json' } as FileSystemFileHandle;

      await factory.replaceProvider({
        type: StorageProviderType.LOCAL,
        fileHandle: mockFileHandle,
      });

      const provider = factory.getCurrentProvider();
      expect(provider).toBeInstanceOf(LocalStorageProvider);
      expect(provider.getFileName()).toBe('test.json');
    });

    it('should save fileInfo config to localStorage for OneDrive', async () => {
      const fileInfo = {
        fileId: 'test-id',
        filePath: '/test/path',
        fileName: 'test.json',
        isNew: false,
      };

      await factory.replaceProvider({
        type: StorageProviderType.ONEDRIVE,
        fileInfo,
      });

      const saved = localStorage.getItem('moneyTree.storageProviderConfig');
      expect(saved).toBeTruthy();
      expect(JSON.parse(saved!)).toEqual({ type: 'onedrive', fileInfo });
    });
  });

  describe('resetProvider', () => {
    it('should clear cached provider instances', async () => {
      const mockFileHandle = { name: 'test.json' } as FileSystemFileHandle;
      await factory.replaceProvider({
        type: StorageProviderType.LOCAL,
        fileHandle: mockFileHandle,
      });

      const provider1 = factory.getCurrentProvider();
      await factory.resetProvider();

      // After clearing cache, should throw when trying to get provider without cached instance
      expect(() => factory.getCurrentProvider()).toThrow();
    });
  });
});
