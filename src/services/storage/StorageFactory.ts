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
  fileHandle?: FileSystemFileHandle; // For Local
  fileInfo?: SelectedFileInfo; // For OneDrive
}

const STORAGE_PROVIDER_KEY = 'moneyTree.storageProvider';
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
  private static providers: Map<StorageProviderType, IStorageProvider> = new Map();
  private static currentProviderType: StorageProviderType = StorageFactory.loadProviderType();
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
   * Clear file handle from IndexedDB (for Local provider)
   */
  static async clearFileHandleCache(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(FILE_HANDLE_KEY);

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });

      db.close();
    } catch (error) {
      console.warn('Failed to clear cached file handle from IndexedDB:', error);
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
      const config = await this.loadProviderConfig(this.currentProviderType);
      if (!config) {
        return false;
      }
      const provider = await this.createProvider(this.currentProviderType, config);
      this.providers.set(this.currentProviderType, provider);
      return true;
    } catch (error) {
      console.warn('Failed to initialize provider from storage:', error);
      return false;
    }
  }

  /**
   * Replace current provider with new configuration
   * Creates a new provider instance and caches it immediately
   */
  static async replaceProvider(type: StorageProviderType, config?: ProviderConfig): Promise<void> {
    // Save new provider type
    this.currentProviderType = type;
    this.saveProviderType(type);

    await this.saveProviderConfig(type, config);
    const provider = await this.createProvider(this.currentProviderType, config);
    this.providers.set(this.currentProviderType, provider);
  }

  /**
   * Load saved provider type from localStorage
   */
  private static loadProviderType(): StorageProviderType {
    const saved = localStorage.getItem(STORAGE_PROVIDER_KEY);
    if (saved && Object.values(StorageProviderType).includes(saved as StorageProviderType)) {
      return saved as StorageProviderType;
    }
    return StorageProviderType.LOCAL;
  }

  /**
   * Save provider type to localStorage
   */
  private static saveProviderType(type: StorageProviderType): void {
    localStorage.setItem(STORAGE_PROVIDER_KEY, type);
  }

  /**
   * Load provider configuration from storage
   * Handles provider-specific storage (IndexedDB for Local, localStorage for OneDrive)
   */
  private static async loadProviderConfig(
    type: StorageProviderType
  ): Promise<ProviderConfig | undefined> {
    switch (type) {
      case StorageProviderType.LOCAL: {
        const fileHandle = await this.loadFileHandleFromCache();
        return fileHandle ? { fileHandle } : undefined;
      }
      case StorageProviderType.ONEDRIVE: {
        const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch (error) {
            console.warn('Failed to parse stored provider config:', error);
          }
        }
        return undefined;
      }
      default:
        return undefined;
    }
  }

  /**
   * Save provider configuration to storage
   * Handles provider-specific storage (IndexedDB for Local, localStorage for OneDrive)
   */
  private static async saveProviderConfig(
    type: StorageProviderType,
    config?: ProviderConfig
  ): Promise<void> {
    switch (type) {
      case StorageProviderType.LOCAL: {
        if (config?.fileHandle) {
          await this.saveFileHandleToCache(config.fileHandle);
        } else {
          await this.clearFileHandleCache();
        }
        break;
      }
      case StorageProviderType.ONEDRIVE: {
        if (config?.fileInfo) {
          const serializableConfig: ProviderConfig = { fileInfo: config.fileInfo };
          localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(serializableConfig));
        } else {
          localStorage.removeItem(STORAGE_CONFIG_KEY);
        }
        break;
      }
      default:
        // For other providers, clear config
        localStorage.removeItem(STORAGE_CONFIG_KEY);
        break;
    }
  }

  /**
   * Get the current storage provider
   * Throws an error if no provider is configured
   */
  static getCurrentProvider(): IStorageProvider {
    const provider = this.providers.get(this.currentProviderType);
    if (!provider) {
      throw new Error('No storage provider configured. Please select a file first.');
    }
    return provider;
  }

  /**
   * Set the current storage provider type
   */
  static setProviderType(type: StorageProviderType): void {
    this.currentProviderType = type;
    this.saveProviderType(type);
  }

  /**
   * Get the current provider type
   */
  static getProviderType(): StorageProviderType {
    return this.currentProviderType;
  }

  /**
   * Create a new storage provider instance
   * If config is provided, uses it directly; otherwise loads from storage
   */
  private static async createProvider(
    type: StorageProviderType,
    config?: ProviderConfig
  ): Promise<IStorageProvider> {
    // Load config from storage if not provided
    const effectiveConfig = config || (await this.loadProviderConfig(type));

    switch (type) {
      case StorageProviderType.LOCAL: {
        const handle = effectiveConfig?.fileHandle;
        if (!handle) {
          throw new Error('No cached file handle found. Please select a file first.');
        }
        return new LocalStorageProvider(handle);
      }
      case StorageProviderType.ONEDRIVE: {
        const fileInfo = effectiveConfig?.fileInfo;
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
