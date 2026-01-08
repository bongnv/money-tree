const STORAGE_KEYS = {
  STORAGE_PROVIDER: 'moneytree_storage_provider',
  ARCHIVE_PROMPT_POSTPONED_AT: 'moneytree_archive_prompt_postponed_at',
} as const;

export const storageService = {
  getStorageProvider(): string {
    return localStorage.getItem(STORAGE_KEYS.STORAGE_PROVIDER) || 'local';
  },

  setStorageProvider(provider: string): void {
    localStorage.setItem(STORAGE_KEYS.STORAGE_PROVIDER, provider);
  },

  getArchivePromptPostponedAt(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ARCHIVE_PROMPT_POSTPONED_AT);
  },

  setArchivePromptPostponedAt(timestamp: string): void {
    localStorage.setItem(STORAGE_KEYS.ARCHIVE_PROMPT_POSTPONED_AT, timestamp);
  },

  clearArchivePromptPostponedAt(): void {
    localStorage.removeItem(STORAGE_KEYS.ARCHIVE_PROMPT_POSTPONED_AT);
  },

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  },
};
