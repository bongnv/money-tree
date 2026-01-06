import { storageService } from './storage.service';

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('currentYear', () => {
    it('should store and retrieve current year', () => {
      storageService.setCurrentYear(2024);
      expect(storageService.getCurrentYear()).toBe(2024);
    });

    it('should return null when no year is stored', () => {
      expect(storageService.getCurrentYear()).toBeNull();
    });
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
      storageService.setCurrentYear(2024);
      storageService.setStorageProvider('onedrive');

      storageService.clearAll();

      expect(storageService.getCurrentYear()).toBeNull();
      expect(storageService.getStorageProvider()).toBe('local');
    });
  });
});
