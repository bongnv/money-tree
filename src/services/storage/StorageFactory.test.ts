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
    it('should return LocalStorageProvider by default', () => {
      const provider = StorageFactory.getCurrentProvider();
      expect(provider).toBeInstanceOf(LocalStorageProvider);
    });

    it('should return same instance on multiple calls', () => {
      const provider1 = StorageFactory.getCurrentProvider();
      const provider2 = StorageFactory.getCurrentProvider();
      expect(provider1).toBe(provider2);
    });

    it('should return OneDriveProvider when set', () => {
      StorageFactory.setProviderType(StorageProviderType.ONEDRIVE);
      const provider = StorageFactory.getCurrentProvider();
      expect(provider).toBeInstanceOf(OneDriveProvider);
    });

    it('should throw error for Google Drive provider (not yet implemented)', () => {
      StorageFactory.setProviderType(StorageProviderType.GOOGLE_DRIVE);
      expect(() => StorageFactory.getCurrentProvider()).toThrow(
        'Google Drive storage provider not yet implemented'
      );
    });

    it('should throw error for Dropbox provider (not yet implemented)', () => {
      StorageFactory.setProviderType(StorageProviderType.DROPBOX);
      expect(() => StorageFactory.getCurrentProvider()).toThrow(
        'Dropbox storage provider not yet implemented'
      );
    });
  });

  describe('setProviderType', () => {
    it('should change current provider type', () => {
      StorageFactory.setProviderType(StorageProviderType.LOCAL);
      expect(StorageFactory.getProviderType()).toBe(StorageProviderType.LOCAL);
    });

    it('should return new provider instance after type change', () => {
      const localProvider = StorageFactory.getCurrentProvider();

      StorageFactory.clearCache();
      StorageFactory.setProviderType(StorageProviderType.LOCAL);
      const newProvider = StorageFactory.getCurrentProvider();

      expect(newProvider).not.toBe(localProvider);
      expect(newProvider).toBeInstanceOf(LocalStorageProvider);
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
    it('should replace provider with new configuration', () => {
      const provider1 = StorageFactory.getCurrentProvider();
      StorageFactory.replaceProvider(StorageProviderType.LOCAL, {});
      const provider2 = StorageFactory.getCurrentProvider();

      expect(provider1).not.toBe(provider2);
    });

    it('should save fileInfo config to localStorage', () => {
      const fileInfo = {
        fileId: 'test-id',
        filePath: '/test/path',
        fileName: 'test.json',
        isNew: false,
      };

      StorageFactory.replaceProvider(StorageProviderType.ONEDRIVE, { fileInfo });

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
    it('should clear cached provider instances', () => {
      const provider1 = StorageFactory.getCurrentProvider();
      StorageFactory.clearCache();
      const provider2 = StorageFactory.getCurrentProvider();

      expect(provider1).not.toBe(provider2);
    });
  });
});
