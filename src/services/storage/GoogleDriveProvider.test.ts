// GoogleDriveProvider tests
// Provider now only handles raw file I/O and authentication
// Integration tests with StorageService are in StorageService.test.ts

import { GoogleDriveProvider } from './GoogleDriveProvider';

describe('GoogleDriveProvider', () => {
  it('should create instance', () => {
    const provider = new GoogleDriveProvider();
    expect(provider).toBeInstanceOf(GoogleDriveProvider);
  });

  it('should return provider name', () => {
    const provider = new GoogleDriveProvider();
    expect(provider.getName()).toBe('Google Drive');
  });

  // authentication, readFile, writeFile, listDriveFiles tested via StorageService integration tests
});
