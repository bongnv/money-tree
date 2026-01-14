import { IStorageProvider } from './IStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { OneDriveProvider, SelectedFileInfo as OneDriveFileInfo } from './OneDriveProvider';
import { OneDriveService } from './OneDriveService';
import {
  GoogleDriveProvider,
  SelectedFileInfo as GoogleDriveFileInfo,
} from './GoogleDriveProvider';
import { GoogleDriveService } from './GoogleDriveService';

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
  fileInfo?: OneDriveFileInfo | GoogleDriveFileInfo; // For OneDrive or Google Drive
}

const STORAGE_CONFIG_KEY = 'moneyTree.storageProviderConfig';
const DB_NAME = 'MoneyTreeDB';
const DB_VERSION = 1;
const STORE_NAME = 'fileHandles';
const FILE_HANDLE_KEY = 'cachedFileHandle';

/**
 * Storage factory (Singleton)
 * Creates and manages storage provider instances
 * Handles caching for both localStorage (OneDrive fileInfo) and IndexedDB (Local fileHandle)
 */
export class StorageFactory {
  private provider: IStorageProvider | null = null;
  private oneDriveService: OneDriveService | null = null;
  private googleDriveService: GoogleDriveService | null = null;

  constructor() {}

  /**
   * Initialize storage provider with authentication handling
   * This is the main entry point for app initialization
   *
   * @param showReconnectDialog - Optional callback for OneDrive/Google Drive reconnection
   * @returns true if provider loaded successfully
   */
  initialize = async (
    showReconnectDialog?: (providerName: string) => Promise<'reconnect' | 'dismiss'>
  ): Promise<boolean> => {
    let loaded = await this.loadCachedProvider();

    if (!loaded && showReconnectDialog) {
      // Check if OneDrive or Google Drive needs reconnection
      const config = await this.loadProviderConfig();
      if (config?.type === StorageProviderType.ONEDRIVE) {
        loaded = await this.reconnectOneDrive(showReconnectDialog);
      } else if (config?.type === StorageProviderType.GOOGLE_DRIVE) {
        loaded = await this.reconnectGoogleDrive(showReconnectDialog);
      }
    }

    return loaded;
  };

  /**
   * Handle OneDrive reconnection flow
   */
  private reconnectOneDrive = async (
    showReconnectDialog: (name: string) => Promise<'reconnect' | 'dismiss'>
  ): Promise<boolean> => {
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
  };

  /**
   * Handle Google Drive reconnection flow
   */
  private reconnectGoogleDrive = async (
    showReconnectDialog: (name: string) => Promise<'reconnect' | 'dismiss'>
  ): Promise<boolean> => {
    const action = await showReconnectDialog('Google Drive');

    if (action === 'dismiss') {
      // Config remains cached for future use
      return false;
    }

    // Authenticate within user interaction context
    const service = this.getGoogleDriveService();
    await service.authenticate();
    return await this.loadCachedProvider();
  };

  /**
   * Get IndexedDB connection for caching file handles
   */
  private getDB = async (): Promise<IDBDatabase> => {
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
  };

  /**
   * Save file handle to IndexedDB (for Local provider)
   */
  private saveFileHandleToCache = async (handle: FileSystemFileHandle): Promise<void> => {
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
  };

  /**
   * Load file handle from IndexedDB (for Local provider)
   */
  private loadFileHandleFromCache = async (): Promise<FileSystemFileHandle | null> => {
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
  };

  /**
   * Get or create the singleton OneDrive service (internal)
   */
  private getOneDriveService = (): OneDriveService => {
    if (!this.oneDriveService) {
      this.oneDriveService = new OneDriveService();
    }
    return this.oneDriveService;
  };

  /**
   * Get or create the singleton Google Drive service (internal)
   */
  private getGoogleDriveService = (): GoogleDriveService => {
    if (!this.googleDriveService) {
      this.googleDriveService = new GoogleDriveService();
    }
    return this.googleDriveService;
  };

  /**
   * Show Google Drive file picker
   */
  showGoogleDriveFilePicker = async (allowCreate: boolean = true) => {
    return this.getGoogleDriveService().showFilePicker(allowCreate);
  };

  /**
   * Load provider from cached configuration (internal)
   * For OneDrive/Google Drive, checks if authenticated but does NOT show dialogs
   */
  private loadCachedProvider = async (): Promise<boolean> => {
    try {
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

      // For Google Drive, check authentication BEFORE creating provider
      if (config.type === StorageProviderType.GOOGLE_DRIVE) {
        const service = this.getGoogleDriveService();
        const isAuth = await service.isAuthenticated();

        if (!isAuth) {
          return false;
        }
      }

      // Authentication confirmed (or not needed for Local), create provider
      this.provider = await this.createProvider(config);

      return true;
    } catch (error) {
      console.warn('Failed to load cached provider:', error);
      // Clear invalid cache
      await this.resetProvider();
      return false;
    }
  };

  /**
   * Replace current provider with new configuration
   * Creates a new provider instance and caches it immediately
   * Automatically clears the old provider's configuration
   */
  replaceProvider = async (config: ProviderConfig): Promise<void> => {
    await this.saveProviderConfig(config);
    this.provider = await this.createProvider(config);
  };

  /**
   * Authenticate OneDrive service
   * Must be called within user interaction context (button click)
   */
  authenticateOneDrive = async (): Promise<void> => {
    const service = this.getOneDriveService();
    await service.authenticate();
  };

  /**
   * Authenticate Google Drive service
   * Must be called within user interaction context (button click)
   */
  authenticateGoogleDrive = async (): Promise<void> => {
    const service = this.getGoogleDriveService();
    await service.authenticate();
  };

  /**
   * List OneDrive folders
   * @param parentItem Parent folder or null for root
   */
  listOneDriveFolders = async (parentItem?: any): Promise<any[]> => {
    const service = this.getOneDriveService();
    return service.listFolders(parentItem);
  };

  /**
   * List Google Drive files
   * @param parentId Parent folder ID or undefined for root
   */
  listGoogleDriveFiles = async (parentId?: string): Promise<any[]> => {
    const service = this.getGoogleDriveService();
    return service.listFiles(parentId);
  };

  /**
   * Load provider configuration from storage (internal)
   */
  private loadProviderConfig = async (): Promise<ProviderConfig | undefined> => {
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
  };

  /**
   * Save provider configuration to storage
   * Stores type in localStorage, and fileHandle in IndexedDB for Local provider
   */
  private saveProviderConfig = async (config: ProviderConfig): Promise<void> => {
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
  };

  /**
   * Get the current storage provider
   * Throws an error if no provider is configured
   */
  getCurrentProvider(): IStorageProvider {
    if (!this.provider) {
      throw new Error('No storage provider configured. Please select a file first.');
    }
    return this.provider;
  }

  /**
   * Create a new storage provider instance from config
   */
  private createProvider = async (config: ProviderConfig): Promise<IStorageProvider> => {
    switch (config.type) {
      case StorageProviderType.LOCAL: {
        const handle = config.fileHandle;
        if (!handle) {
          throw new Error('No cached file handle found. Please select a file first.');
        }
        return new LocalStorageProvider(handle);
      }
      case StorageProviderType.ONEDRIVE: {
        const fileInfo = config.fileInfo as OneDriveFileInfo;
        if (!fileInfo) {
          throw new Error('No cached file info found. Please select a file first.');
        }
        // Service already created and authenticated by loadCachedProvider
        const service = this.getOneDriveService();
        return new OneDriveProvider(service, fileInfo);
      }
      case StorageProviderType.GOOGLE_DRIVE: {
        const fileInfo = config.fileInfo as GoogleDriveFileInfo;
        if (!fileInfo) {
          throw new Error('No cached file info found. Please select a file first.');
        }
        // Service already created and authenticated by loadCachedProvider
        const service = this.getGoogleDriveService();
        return new GoogleDriveProvider(service, fileInfo);
      }
      case StorageProviderType.DROPBOX:
        throw new Error('Dropbox storage provider not yet implemented');
      default:
        throw new Error(`Unknown storage provider type: ${config.type}`);
    }
  };

  /**
   * Reset provider instances and configuration
   * Used for "reset to welcome" feature - clears provider and config
   * MSAL manages its own cache automatically
   */
  resetProvider = async (): Promise<void> => {
    // Clear provider instance
    this.provider = null;

    // Clear OneDrive service instance - will be recreated on next use
    this.oneDriveService = null;

    // Clear Google Drive service instance - will be recreated on next use
    this.googleDriveService = null;

    // Remove provider config - MSAL will handle its own cache cleanup
    localStorage.removeItem(STORAGE_CONFIG_KEY);
  };
}
