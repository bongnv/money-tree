const STORAGE_KEYS = {
  CURRENT_YEAR: 'moneytree_current_year',
  LAST_SAVED: 'moneytree_last_saved',
  UNSAVED_CHANGES: 'moneytree_unsaved_changes',
  STORAGE_PROVIDER: 'moneytree_storage_provider',
  FILE_NAME: 'moneytree_file_name',
} as const;

export const storageService = {
  getCurrentYear(): number | null {
    const year = localStorage.getItem(STORAGE_KEYS.CURRENT_YEAR);
    return year ? parseInt(year, 10) : null;
  },

  setCurrentYear(year: number): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_YEAR, year.toString());
  },

  getLastSaved(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_SAVED);
  },

  setLastSaved(timestamp: string): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED, timestamp);
  },

  getUnsavedChanges(): boolean {
    return localStorage.getItem(STORAGE_KEYS.UNSAVED_CHANGES) === 'true';
  },

  setUnsavedChanges(hasChanges: boolean): void {
    localStorage.setItem(STORAGE_KEYS.UNSAVED_CHANGES, hasChanges.toString());
  },

  getStorageProvider(): string {
    return localStorage.getItem(STORAGE_KEYS.STORAGE_PROVIDER) || 'local';
  },

  setStorageProvider(provider: string): void {
    localStorage.setItem(STORAGE_KEYS.STORAGE_PROVIDER, provider);
  },

  getFileName(): string | null {
    return localStorage.getItem(STORAGE_KEYS.FILE_NAME);
  },

  setFileName(fileName: string): void {
    localStorage.setItem(STORAGE_KEYS.FILE_NAME, fileName);
  },

  clearFileName(): void {
    localStorage.removeItem(STORAGE_KEYS.FILE_NAME);
  },

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  },
};
