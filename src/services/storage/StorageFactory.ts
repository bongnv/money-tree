import { IStorageProvider } from './IStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';

/**
 * Storage provider type
 */
export enum StorageProviderType {
  LOCAL = 'local',
  ONEDRIVE = 'onedrive',
  GOOGLE_DRIVE = 'google_drive',
  DROPBOX = 'dropbox',
}

/**
 * Storage factory
 * Creates and manages storage provider instances
 */
export class StorageFactory {
  private static providers: Map<StorageProviderType, IStorageProvider> = new Map();
  private static currentProviderType: StorageProviderType = StorageProviderType.LOCAL;

  /**
   * Get the current storage provider
   */
  static getCurrentProvider(): IStorageProvider {
    if (!this.providers.has(this.currentProviderType)) {
      this.providers.set(this.currentProviderType, this.createProvider(this.currentProviderType));
    }
    return this.providers.get(this.currentProviderType)!;
  }

  /**
   * Set the current storage provider type
   */
  static setProviderType(type: StorageProviderType): void {
    this.currentProviderType = type;
  }

  /**
   * Get the current provider type
   */
  static getProviderType(): StorageProviderType {
    return this.currentProviderType;
  }

  /**
   * Create a new storage provider instance
   */
  private static createProvider(type: StorageProviderType): IStorageProvider {
    switch (type) {
      case StorageProviderType.LOCAL:
        return new LocalStorageProvider();
      case StorageProviderType.ONEDRIVE:
        throw new Error('OneDrive storage provider not yet implemented (Phase 18+)');
      case StorageProviderType.GOOGLE_DRIVE:
        throw new Error('Google Drive storage provider not yet implemented');
      case StorageProviderType.DROPBOX:
        throw new Error('Dropbox storage provider not yet implemented');
      default:
        throw new Error(`Unknown storage provider type: ${type}`);
    }
  }

  /**
   * Clear cached provider instances
   */
  static clearCache(): void {
    this.providers.clear();
  }
}
