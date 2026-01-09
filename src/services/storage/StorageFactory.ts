import { IStorageProvider } from './IStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { OneDriveProvider, SelectedFileInfo } from './OneDriveProvider';
import { OneDriveService } from './OneDriveService';

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
 * Provider configuration for initialization
 */
export interface ProviderConfig {
  type: StorageProviderType; // Provider type
  fileHandle?: FileSystemFileHandle; // For Local
  fileInfo?: SelectedFileInfo; // For OneDrive
}

const STORAGE_CONFIG_KEY = 'moneyTree.storageProviderConfig';
const DB_NAME = 'MoneyTreeDB';
const DB_VERSION = 1;
const STORE_NAME = 'fileHandles';
const FILE_HANDLE_KEY = 'cachedFileHandle';

/**
 * Storage factory
 * Creates and manages storage provider instances
 * Handles caching for both localStorage (OneDrive fileInfo) and IndexedDB (Local fileHandle)
 */
export class StorageFactory {
  private static provider: IStorageProvider | null = null;
  private static oneDriveService: OneDriveService | null = null;

  /**
   * Get IndexedDB connection for caching file handles
   */
  private static async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  /**
   * Save file handle to IndexedDB (for Local provider)
   */
  private static async saveFileHandleToCache(handle: FileSystemFileHandle): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(handle, FILE_HANDLE_KEY);

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });

      db.close();
    } catch (error) {
      console.warn('Failed to cache file handle in IndexedDB:', error);
    }
  }

  /**
   * Load file handle from IndexedDB (for Local provider)
   */
  private static async loadFileHandleFromCache(): Promise<FileSystemFileHandle | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(FILE_HANDLE_KEY);

      const handle = await new Promise<FileSystemFileHandle | null>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      db.close();
      return handle;
    } catch (error) {
      console.warn('Failed to load cached file handle from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Get OneDrive service singleton
   * Used for authentication and file browsing
   */
  static getOneDriveService(): OneDriveService {
    if (!this.oneDriveService) {
      this.oneDriveService = new OneDriveService();
    }
    return this.oneDriveService;
  }

  /**
   * Initialize provider from storage
   * Called on app startup to auto-load cached provider configuration
   * Returns true if provider was successfully initialized, false if no cached config found
   */
  static async initializeProvider(): Promise<boolean> {
    try {
      const config = await this.loadProviderConfig();
      if (!config) {
        return false;
      }

      this.provider = await this.createProvider(config);
      return true;
    } catch (error) {
      console.warn('Failed to initialize provider from storage:', error);
      return false;
    }
  }

  /**
   * Replace current provider with new configuration
   * Creates a new provider instance and caches it immediately
   * Automatically clears the old provider's configuration
   */
  static async replaceProvider(config: ProviderConfig): Promise<void> {
    await this.saveProviderConfig(config);
    this.provider = await this.createProvider(config);
  }

  /**
   * Load provider configuration from storage
   * Loads from localStorage and augments with IndexedDB fileHandle if Local provider
   */
  static async loadProviderConfig(): Promise<ProviderConfig | undefined> {
    // Load config from localStorage
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (!saved) {
      return undefined;
    }

    try {
      const config: ProviderConfig = JSON.parse(saved);

      // If Local provider, augment with fileHandle from IndexedDB
      if (config.type === StorageProviderType.LOCAL) {
        const fileHandle = await this.loadFileHandleFromCache();
        if (fileHandle) {
          config.fileHandle = fileHandle;
        }
      }

      return config;
    } catch (error) {
      console.warn('Failed to parse stored provider config:', error);
      return undefined;
    }
  }

  /**
   * Save provider configuration to storage
   * Stores type in localStorage, and fileHandle in IndexedDB for Local provider
   */
  private static async saveProviderConfig(config: ProviderConfig): Promise<void> {
    // For Local provider, save fileHandle to IndexedDB separately
    if (config.type === StorageProviderType.LOCAL && config.fileHandle) {
      await this.saveFileHandleToCache(config.fileHandle);
    }

    // Save config to localStorage (without fileHandle for Local)
    const serializableConfig = {
      type: config.type,
      ...(config.fileInfo && { fileInfo: config.fileInfo }),
      // Don't store fileHandle in localStorage for Local provider
    };

    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(serializableConfig));
  }

  /**
   * Get the current storage provider
   * Throws an error if no provider is configured
   */
  static getCurrentProvider(): IStorageProvider {
    if (!this.provider) {
      throw new Error('No storage provider configured. Please select a file first.');
    }
    return this.provider;
  }

  /**
   * Create a new storage provider instance from config
   */
  private static async createProvider(config: ProviderConfig): Promise<IStorageProvider> {
    switch (config.type) {
      case StorageProviderType.LOCAL: {
        const handle = config.fileHandle;
        if (!handle) {
          throw new Error('No cached file handle found. Please select a file first.');
        }
        return new LocalStorageProvider(handle);
      }
      case StorageProviderType.ONEDRIVE: {
        const fileInfo = config.fileInfo;
        if (!fileInfo) {
          throw new Error('No cached file info found. Please select a file first.');
        }
        return new OneDriveProvider(this.getOneDriveService(), fileInfo);
      }
      case StorageProviderType.GOOGLE_DRIVE:
        throw new Error('Google Drive storage provider not yet implemented');
      case StorageProviderType.DROPBOX:
        throw new Error('Dropbox storage provider not yet implemented');
      default:
        throw new Error(`Unknown storage provider type: ${config.type}`);
    }
  }

  /**
   * Clear cached provider instances and all provider configurations
   * Used when disconnecting from all providers
   */
  static async clearCache(): Promise<void> {
    // Disconnect OneDrive service if active
    if (this.provider?.getName() === 'OneDrive' && this.oneDriveService) {
      this.oneDriveService.disconnect();
      this.oneDriveService = null;
    }

    // Clear provider instance
    this.provider = null;

    localStorage.removeItem(STORAGE_CONFIG_KEY);
  }
}
