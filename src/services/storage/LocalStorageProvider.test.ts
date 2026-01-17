// LocalStorageProvider tests
// Provider now only handles raw file I/O (readFile, writeFile)
// Integration tests with StorageService are in StorageService.test.ts

import { LocalStorageProvider } from './LocalStorageProvider';

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;

  beforeEach(() => {
    provider = new LocalStorageProvider();
  });

  it('should create instance', () => {
    expect(provider).toBeInstanceOf(LocalStorageProvider);
  });

  it('should return provider name', () => {
    expect(provider.getName()).toBe('Local File');
  });

  it('should not throw error when authenticating without file handle', async () => {
    // authenticate() should silently return if no file handle is set
    await expect(provider.authenticate()).resolves.toBeUndefined();
  });

  // readFile and writeFile tested via StorageService integration tests
});
