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

  it('should throw error when authenticating without file handle', async () => {
    await expect(provider.authenticate()).rejects.toThrow(
      'No file handle available for permission request'
    );
  });

  // readFile and writeFile tested via StorageService integration tests
});
