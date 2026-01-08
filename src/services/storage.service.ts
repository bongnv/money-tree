const STORAGE_KEYS = {
  STORAGE_PROVIDER: 'moneytree_storage_provider',
} as const;

export const storageService = {
  getStorageProvider(): string {
    return localStorage.getItem(STORAGE_KEYS.STORAGE_PROVIDER) || 'local';
  },

  setStorageProvider(provider: string): void {
    localStorage.setItem(STORAGE_KEYS.STORAGE_PROVIDER, provider);
  },

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  },
};
