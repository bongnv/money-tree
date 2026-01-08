import { storageService } from './storage.service';

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('storageProvider', () => {
    it('should store and retrieve storage provider', () => {
      storageService.setStorageProvider('onedrive');
      expect(storageService.getStorageProvider()).toBe('onedrive');
    });

    it('should return "local" as default provider', () => {
      expect(storageService.getStorageProvider()).toBe('local');
    });
  });

  describe('clearAll', () => {
    it('should clear all stored data', () => {
      storageService.setStorageProvider('onedrive');

      storageService.clearAll();

      expect(storageService.getStorageProvider()).toBe('local');
    });
  });
});
