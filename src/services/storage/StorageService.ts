import { IStorageProvider } from './IStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { OneDriveProvider } from './OneDriveProvider';
import { GoogleDriveProvider } from './GoogleDriveProvider';
import type { DataFile } from '../../types/models';
import { DataFileSchema } from '../../schemas/models.schema';

/**
 * Storage provider type
 */
export enum StorageProviderType {
  LOCAL = 'local',
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

interface StoredConfig {
  type: StorageProviderType;
}

/**
 * Storage Service
 * Unified interface for all storage operations
 * Handles JSON serialization and manages which provider is active
 * Providers manage their own file state and caching
 */
export class StorageService {
  private currentProvider: IStorageProvider | null = null;
  private currentType: StorageProviderType | null = null;
  private onReconnectNeeded: (providerName: string) => Promise<'reconnect' | 'dismiss'>;

  constructor(onReconnectNeeded: (providerName: string) => Promise<'reconnect' | 'dismiss'>) {
    this.onReconnectNeeded = onReconnectNeeded;
  }

  /**
   * Initialize service and restore cached connection
   * Called once at app startup
   * @returns true if successfully restored cached connection
   */
  async initialize(): Promise<boolean> {
    try {
      const config = this.loadConfig();
      if (!config) {
        return false;
      }

      // Create provider
      const provider = this.createProvider(config.type);
      if (!provider) {
        return false;
      }

      // Initialize provider (load cached file and check auth)
      const success = await provider.initialize();
      if (!success) {
        // Check if we have a file cached but need reconnection
        if (provider.getMainFileName()) {
          const action = await this.onReconnectNeeded(provider.getName());

          if (action === 'reconnect') {
            // Re-authenticate and retry
            try {
              await provider.authenticate();
              const retrySuccess = await provider.initialize();
              if (!retrySuccess) {
                return false;
              }

              this.currentProvider = provider;
              this.currentType = config.type;
              return true;
            } catch (error) {
              console.warn('Failed to reconnect:', error);
              this.clearCache();
              return false;
            }
          } else {
            // User dismissed - clear cache
            this.clearCache();
            return false;
          }
        }
        return false;
      }

      this.currentProvider = provider;
      this.currentType = config.type;

      return true;
    } catch (error) {
      console.warn('Failed to restore cached connection:', error);
      this.clearCache();
      return false;
    }
  }

  /**
   * Connect to a storage provider (authenticate for cloud)
   * @param config Connection configuration
   */
  async connect(config: ConnectConfig): Promise<void> {
    const provider = this.createProvider(config.type);
    if (!provider) {
      throw new Error(`Provider not available: ${config.type}`);
    }

    // Authenticate (no-op for local, popup for cloud)
    await provider.authenticate();

    this.currentType = config.type;
    this.currentProvider = provider;

    // Save provider type to localStorage
    this.saveConfig();
  }

  /**
   * Disconnect current provider
   */
  async disconnect(): Promise<void> {
    if (this.currentProvider) {
      await this.currentProvider.clearCache();
    }
    this.currentProvider = null;
    this.currentType = null;
    this.clearCache();
  }

  /**
   * Load data file from current provider
   * Handles JSON parsing and validation
   * Automatically handles auth errors with reconnect dialog if callback is configured
   * @throws Error if not connected, data is invalid, or reconnection fails
   */
  async loadDataFile(): Promise<DataFile> {
    if (!this.currentProvider) {
      throw new Error('No storage provider connected. Please select a file first.');
    }

    // Read file content (handles auth errors with reconnection)
    const content = await this.readMainFileWithAuth();

    // Parse and validate content (separate from auth errors)
    try {
      const parsed = JSON.parse(content);
      return DataFileSchema.parse(parsed) as DataFile;
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw new Error(`Invalid data file format: ${error.message}`);
      }
      throw new Error('Failed to parse data file: invalid JSON');
    }
  }

  /**
   * Read main file from current provider with automatic auth error handling
   * If auth expires, shows reconnect dialog and retries after re-authentication
   * @throws Error if not connected, auth fails, or user cancels reconnection
   */
  private async readMainFileWithAuth(): Promise<string> {
    if (!this.currentProvider) {
      throw new Error('No storage provider connected.');
    }

    try {
      return await this.currentProvider.readMainFile();
    } catch (error) {
      console.error('Failed to read main file:', error);

      // Check if error is auth-related
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isAuthError =
        errorMessage.includes('auth') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('401');

      if (isAuthError) {
        const providerName = this.currentProvider.getName();
        const action = await this.onReconnectNeeded(providerName);

        if (action === 'reconnect') {
          // Re-authenticate and retry
          try {
            await this.currentProvider.authenticate();
            return await this.currentProvider.readMainFile();
          } catch (retryError) {
            console.error('Failed to load data after reconnection:', retryError);
            throw new Error(
              `Failed to load data after reconnection: ${retryError instanceof Error ? retryError.message : String(retryError)}`
            );
          }
        } else {
          // User dismissed - keep connection but throw error
          throw new Error('User cancelled reconnection');
        }
      }

      // Re-throw original error if not auth-related
      throw error;
    }
  }

  /**
   * Save data file to current provider
   * Handles JSON stringification
   * @throws Error if not connected
   */
  async saveDataFile(data: DataFile): Promise<void> {
    if (!this.currentProvider) {
      throw new Error('No storage provider connected. Please select a file first.');
    }

    const content = JSON.stringify(data);
    await this.currentProvider.writeMainFile(content);
  }

  /**
   * Save a file (e.g., backup ZIP, archive JSON)
   * Delegates to provider's saveAdditionalFile method
   * @throws Error if not connected
   */
  async saveFile(data: string | Blob, filename: string): Promise<void> {
    if (!this.currentProvider) {
      throw new Error('No storage provider connected. Please select a file first.');
    }

    await this.currentProvider.saveAdditionalFile(filename, data);
  }

  /**
   * Get current file name
   */
  get fileName(): string | null {
    return this.currentProvider?.getMainFileName() ?? null;
  }

  /**
   * Get current provider name
   */
  get providerName(): string | null {
    return this.currentProvider?.getName() ?? null;
  }

  /**
   * Get current provider instance (for advanced usage like pickers)
   */
  get provider(): IStorageProvider | null {
    return this.currentProvider;
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Create provider instance
   */
  private createProvider(type: StorageProviderType): IStorageProvider | null {
    switch (type) {
      case StorageProviderType.LOCAL:
        return new LocalStorageProvider();

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
  private loadConfig(): StoredConfig | null {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved) as StoredConfig;
    } catch (error) {
      console.warn('Failed to parse stored config:', error);
      return null;
    }
  }

  /**
   * Save configuration to storage
   */
  private saveConfig(): void {
    if (!this.currentType) {
      return;
    }

    const config: StoredConfig = {
      type: this.currentType,
    };

    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  }

  /**
   * Clear cached configuration
   */
  private clearCache(): void {
    localStorage.removeItem(STORAGE_CONFIG_KEY);
  }
}
