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
   * Initialize storage provider with authentication handling
   * This is the main entry point for app initialization
   *
   * @param showReconnectDialog - Optional callback for OneDrive reconnection
   * @returns true if provider loaded successfully
   */
  static async initialize(
    showReconnectDialog?: (providerName: string) => Promise<'reconnect' | 'dismiss'>
  ): Promise<boolean> {
    let loaded = await this.loadCachedProvider();

    if (!loaded && showReconnectDialog) {
      // Check if OneDrive needs reconnection
      const config = await this.loadProviderConfig();
      if (config?.type === StorageProviderType.ONEDRIVE) {
        loaded = await this.reconnectOneDrive(showReconnectDialog);
      }
    }

    return loaded;
  }

  /**
   * Handle OneDrive reconnection flow
   */
  private static async reconnectOneDrive(
    showReconnectDialog: (name: string) => Promise<'reconnect' | 'dismiss'>
  ): Promise<boolean> {
    const action = await showReconnectDialog('OneDrive');

    if (action === 'dismiss') {
      // No need to clear cache - MSAL will manage interaction status in localStorage
      // Config remains cached for future use
      return false;
    }

    // Authenticate within user interaction context
    const service = this.getOneDriveService();
    await service.authenticate();
    return await this.loadCachedProvider();
  }

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
   * Get or create the singleton OneDrive service (internal)
   */
  private static getOneDriveService(): OneDriveService {
    if (!this.oneDriveService) {
      this.oneDriveService = new OneDriveService();
    }
    return this.oneDriveService;
  }

  /**
   * Load provider from cached configuration (internal)
   * For OneDrive, checks if authenticated but does NOT show dialogs
   */
  private static async loadCachedProvider(): Promise<boolean> {
    const config = await this.loadProviderConfig();
    if (!config) {
      return false;
    }

    // For OneDrive, check authentication BEFORE creating provider
    if (config.type === StorageProviderType.ONEDRIVE) {
      const service = this.getOneDriveService();
      const isAuth = await service.isAuthenticated();

      if (!isAuth) {
        return false;
      }
    }

    // Authentication confirmed (or not needed for Local), create provider
    this.provider = await this.createProvider(config);

    return true;
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
   * Authenticate OneDrive service
   * Must be called within user interaction context (button click)
   */
  static async authenticateOneDrive(): Promise<void> {
    const service = this.getOneDriveService();
    await service.authenticate();
  }

  /**
   * List OneDrive folders
   * @param parentItem Parent folder or null for root
   */
  static async listOneDriveFolders(parentItem?: any): Promise<any[]> {
    const service = this.getOneDriveService();
    return service.listFolders(parentItem);
  }

  /**
   * Load provider configuration from storage (internal)
   */
  private static async loadProviderConfig(): Promise<ProviderConfig | undefined> {
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
        // Service already created and authenticated by loadCachedProvider
        const service = this.getOneDriveService();
        return new OneDriveProvider(service, fileInfo);
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
   * Reset provider instances and configuration
   * Used for "reset to welcome" feature - clears provider and config
   * MSAL manages its own cache automatically
   */
  static async resetProvider(): Promise<void> {
    // Clear provider instance
    this.provider = null;

    // Clear OneDrive service instance - will be recreated on next use
    this.oneDriveService = null;

    // Remove provider config - MSAL will handle its own cache cleanup
    localStorage.removeItem(STORAGE_CONFIG_KEY);
  }
}
