import { IStorageProvider } from './IStorageProvider';
import { OneDriveProvider } from './OneDriveProvider';
import { GoogleDriveProvider } from './GoogleDriveProvider';

/**
 * Storage provider type
 */
export enum StorageProviderType {
  ONEDRIVE = 'onedrive',
  GOOGLE_DRIVE = 'google_drive',
}

/**
 * Connection configuration for connect() method
 */
export interface ConnectConfig {
  type: StorageProviderType;
}

const STORAGE_CONFIG_KEY = 'moneyTree.storageProviderConfig';

/**
 * Storage Provider Factory
 * Factory for creating and configuring storage providers
 * Handles provider lifecycle and configuration caching
 */
export class StorageProviderFactory {
  /**
   * Static factory: Initialize and restore cached connection
   * Called once at app startup
   * @returns Provider if successful, null otherwise
   */
  static async initialize(
    onReconnectNeeded: (providerName: string) => Promise<'reconnect' | 'dismiss'>
  ): Promise<IStorageProvider | null> {
    try {
      const config = StorageProviderFactory.loadConfig();
      if (!config) {
        return null;
      }

      // Create provider
      const provider = StorageProviderFactory.createProvider(config);
      if (!provider) {
        return null;
      }

      // Initialize provider (check auth only - file is managed by SyncContext)
      const success = await provider.initialize();
      if (!success) {
        // Need reconnection - provider is not authenticated
        const action = await onReconnectNeeded(provider.getName());

        if (action === 'reconnect') {
          // Re-authenticate and retry
          try {
            await provider.authenticate();
            const retrySuccess = await provider.initialize();
            if (!retrySuccess) {
              return null;
            }

            return provider;
          } catch (error) {
            console.warn('Failed to reconnect:', error);
            StorageProviderFactory.clearCache();
            return null;
          }
        } else {
          // User dismissed - clear cache
          StorageProviderFactory.clearCache();
          return null;
        }
      }

      return provider;
    } catch (error) {
      console.warn('Failed to restore cached connection:', error);
      StorageProviderFactory.clearCache();
      return null;
    }
  }

  /**
   * Static factory: Connect to a storage provider (authenticate for cloud)
   * @param config Connection configuration
   * @returns Provider instance
   */
  static async connect(config: ConnectConfig): Promise<IStorageProvider> {
    const provider = StorageProviderFactory.createProvider(config.type);
    if (!provider) {
      throw new Error(`Provider not available: ${config.type}`);
    }

    // Authenticate (no-op for local, popup for cloud)
    await provider.authenticate();

    // Save provider type to localStorage
    StorageProviderFactory.saveConfig(config.type);

    return provider;
  }

  /**
   * Disconnect and clear cache
   * File info is managed by SyncContext, so we only clear provider config
   */
  static async disconnect(_provider: IStorageProvider | null): Promise<void> {
    // Just clear the provider type config
    StorageProviderFactory.clearCache();
  }

  // ==================== PRIVATE/STATIC METHODS ====================

  /**
   * Create provider instance
   */
  private static createProvider(type: StorageProviderType): IStorageProvider | null {
    switch (type) {
      case StorageProviderType.ONEDRIVE:
        return new OneDriveProvider();

      case StorageProviderType.GOOGLE_DRIVE:
        return new GoogleDriveProvider();

      default:
        return null;
    }
  }

  /**
   * Load configuration from storage
   */
  private static loadConfig(): StorageProviderType | null {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    return saved as StorageProviderType | null;
  }

  /**
   * Save configuration to storage
   */
  private static saveConfig(type: StorageProviderType): void {
    localStorage.setItem(STORAGE_CONFIG_KEY, type);
  }

  /**
   * Clear cached configuration
   */
  private static clearCache(): void {
    localStorage.removeItem(STORAGE_CONFIG_KEY);
  }
}
