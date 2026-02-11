// OneDriveProvider tests
// Provider now only handles raw file I/O and authentication
// Integration tests with StorageService are in StorageService.test.ts

import { OneDriveProvider } from './OneDriveProvider';
import { StorageProviderType } from './IStorageProvider';

describe('OneDriveProvider', () => {
  it('should create instance', () => {
    const provider = new OneDriveProvider();
    expect(provider).toBeInstanceOf(OneDriveProvider);
  });

  it('should return provider type', () => {
    const provider = new OneDriveProvider();
    expect(provider.getType()).toBe(StorageProviderType.ONEDRIVE);
  });

  // authentication, readFile, writeFile, listDriveItems tested via StorageService integration tests
});
