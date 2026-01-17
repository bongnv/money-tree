// OneDriveProvider tests
// Provider now only handles raw file I/O and authentication
// Integration tests with StorageService are in StorageService.test.ts

import { OneDriveProvider } from './OneDriveProvider';

describe('OneDriveProvider', () => {
  it('should create instance', () => {
    const provider = new OneDriveProvider();
    expect(provider).toBeInstanceOf(OneDriveProvider);
  });

  it('should return provider name', () => {
    const provider = new OneDriveProvider();
    expect(provider.getName()).toBe('OneDrive');
  });

  // authentication, readFile, writeFile, listDriveItems tested via StorageService integration tests
});
