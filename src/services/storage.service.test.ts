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

  describe('lastSaved', () => {
    it('should store and retrieve last saved timestamp', () => {
      const timestamp = new Date().toISOString();
      storageService.setLastSaved(timestamp);
      expect(storageService.getLastSaved()).toBe(timestamp);
    });

    it('should return null when no timestamp is stored', () => {
      expect(storageService.getLastSaved()).toBeNull();
    });
  });

  describe('unsavedChanges', () => {
    it('should store and retrieve unsaved changes flag', () => {
      storageService.setUnsavedChanges(true);
      expect(storageService.getUnsavedChanges()).toBe(true);

      storageService.setUnsavedChanges(false);
      expect(storageService.getUnsavedChanges()).toBe(false);
    });

    it('should return false when no flag is stored', () => {
      expect(storageService.getUnsavedChanges()).toBe(false);
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

  describe('fileName', () => {
    it('should store and retrieve file name', () => {
      storageService.setFileName('money-tree-2024.json');
      expect(storageService.getFileName()).toBe('money-tree-2024.json');
    });

    it('should clear file name', () => {
      storageService.setFileName('test.json');
      storageService.clearFileName();
      expect(storageService.getFileName()).toBeNull();
    });

    it('should return null when no file name is stored', () => {
      expect(storageService.getFileName()).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all stored data', () => {
      storageService.setCurrentYear(2024);
      storageService.setLastSaved(new Date().toISOString());
      storageService.setUnsavedChanges(true);
      storageService.setStorageProvider('onedrive');
      storageService.setFileName('test.json');

      storageService.clearAll();

      expect(storageService.getCurrentYear()).toBeNull();
      expect(storageService.getLastSaved()).toBeNull();
      expect(storageService.getUnsavedChanges()).toBe(false);
      expect(storageService.getStorageProvider()).toBe('local');
      expect(storageService.getFileName()).toBeNull();
    });
  });
});

