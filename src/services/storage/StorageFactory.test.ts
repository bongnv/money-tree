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
  beforeEach(() => {
    // Reset factory state before each test
    StorageFactory.clearCache();
    StorageFactory.setProviderType(StorageProviderType.LOCAL);
    // Clear localStorage
    localStorage.clear();
    // Clear mock
    jest.clearAllMocks();
  });

  describe('getCurrentProvider', () => {
    it('should throw error when no provider configured for LOCAL', () => {
      // Test expects error when trying to get Local provider without cached file
      expect(() => StorageFactory.getCurrentProvider()).toThrow('No storage provider configured');
    });

    it('should throw error when no provider configured for ONEDRIVE', () => {
      StorageFactory.setProviderType(StorageProviderType.ONEDRIVE);
      expect(() => StorageFactory.getCurrentProvider()).toThrow('No storage provider configured');
    });

    it('should throw error for Google Drive provider (not yet implemented)', () => {
      StorageFactory.setProviderType(StorageProviderType.GOOGLE_DRIVE);
      expect(() => StorageFactory.getCurrentProvider()).toThrow('No storage provider configured');
    });

    it('should throw error for Dropbox provider (not yet implemented)', () => {
      StorageFactory.setProviderType(StorageProviderType.DROPBOX);
      expect(() => StorageFactory.getCurrentProvider()).toThrow('No storage provider configured');
    });
  });

  describe('setProviderType', () => {
    it('should change current provider type', () => {
      StorageFactory.setProviderType(StorageProviderType.LOCAL);
      expect(StorageFactory.getProviderType()).toBe(StorageProviderType.LOCAL);
    });
  });

  describe('getProviderType', () => {
    it('should return LOCAL by default', () => {
      expect(StorageFactory.getProviderType()).toBe(StorageProviderType.LOCAL);
    });

    it('should return current provider type', () => {
      StorageFactory.setProviderType(StorageProviderType.LOCAL);
      expect(StorageFactory.getProviderType()).toBe(StorageProviderType.LOCAL);
    });

    it('should persist provider type to localStorage', () => {
      StorageFactory.setProviderType(StorageProviderType.ONEDRIVE);
      expect(localStorage.getItem('moneyTree.storageProvider')).toBe(StorageProviderType.ONEDRIVE);
    });
  });

  describe('replaceProvider', () => {
    it('should create LOCAL provider with fileHandle', async () => {
      const mockFileHandle = { name: 'test.json' } as FileSystemFileHandle;

      await StorageFactory.replaceProvider(StorageProviderType.LOCAL, {
        fileHandle: mockFileHandle,
      });

      const provider = StorageFactory.getCurrentProvider();
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

      await StorageFactory.replaceProvider(StorageProviderType.ONEDRIVE, { fileInfo });

      const saved = localStorage.getItem('moneyTree.storageProviderConfig');
      expect(saved).toBeTruthy();
      expect(JSON.parse(saved!)).toEqual({ fileInfo });
    });
  });

  describe('getOneDriveService', () => {
    it('should return OneDriveService singleton', () => {
      const service1 = StorageFactory.getOneDriveService();
      const service2 = StorageFactory.getOneDriveService();
      expect(service1).toBe(service2);
      expect(service1).toBeInstanceOf(OneDriveService);
    });
  });

  describe('clearCache', () => {
    it('should clear cached provider instances', async () => {
      const mockFileHandle = { name: 'test.json' } as FileSystemFileHandle;
      await StorageFactory.replaceProvider(StorageProviderType.LOCAL, {
        fileHandle: mockFileHandle,
      });

      const provider1 = StorageFactory.getCurrentProvider();
      StorageFactory.clearCache();

      // After clearing cache, should throw when trying to get provider without cached instance
      expect(() => StorageFactory.getCurrentProvider()).toThrow();
    });
  });
});
