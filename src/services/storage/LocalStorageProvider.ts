import type { DataFile } from '../../types/models';
import { DataFileSchema } from '../../schemas/models.schema';
import type { IStorageProvider } from './IStorageProvider';

const DB_NAME = 'MoneyTreeDB';
const DB_VERSION = 1;
const STORE_NAME = 'fileHandles';
const FILE_HANDLE_KEY = 'cachedFileHandle';

/**
 * Local storage provider using File System Access API
 * Implements file-based storage on the user's local machine
 * Persists file handle in IndexedDB for auto-load across sessions
 */
export class LocalStorageProvider implements IStorageProvider {
  private fileHandle: FileSystemFileHandle | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Initialize by loading cached file handle from IndexedDB
    this.initPromise = this.initializeFromCache();
  }

  /**
   * Wait for initialization to complete
   * Public method to allow external callers to wait for initialization
   */
  async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Initialize IndexedDB connection
   */
  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
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

    return this.dbPromise;
  }

  /**
   * Check and request permission for a file handle
   * @returns true if permission granted, false otherwise
   */
  private async verifyPermission(fileHandle: FileSystemFileHandle): Promise<boolean> {
    const options: FileSystemHandlePermissionDescriptor = { mode: 'read' };

    // Check if permission was already granted
    if ((await fileHandle.queryPermission(options)) === 'granted') {
      return true;
    }

    // Request permission
    if ((await fileHandle.requestPermission(options)) === 'granted') {
      return true;
    }

    return false;
  }

  /**
   * Load cached file handle from IndexedDB on initialization
   */
  private async initializeFromCache(): Promise<void> {
    if (this.initialized) return;

    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(FILE_HANDLE_KEY);

      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
          if (request.result) {
            this.fileHandle = request.result as FileSystemFileHandle;
          }
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to load cached file handle from IndexedDB:', error);
    } finally {
      this.initialized = true;
    }
  }

  /**
   * Save file handle to IndexedDB
   */
  private async saveCachedHandle(handle: FileSystemFileHandle): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(handle, FILE_HANDLE_KEY);

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.warn('Failed to cache file handle in IndexedDB:', error);
    }
  }

  /**
   * Remove file handle from IndexedDB
   */
  private async removeCachedHandle(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(FILE_HANDLE_KEY);

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.warn('Failed to remove cached file handle from IndexedDB:', error);
    }
  }

  /**
   * Check if File System Access API is supported
   */
  private checkSupport(): void {
    if (!('showOpenFilePicker' in window) || !('showSaveFilePicker' in window)) {
      throw new Error(
        'File System Access API is not supported in this browser. Please use Chrome, Edge, or another compatible browser.'
      );
    }
  }

  /**
   * Load data file
   * Uses cached file handle if available, otherwise opens a file picker
   */
  async loadDataFile(): Promise<DataFile | null> {
    this.checkSupport();

    // Ensure initialization is complete before checking for cached handle
    await this.ensureInitialized();

    try {
      let fileHandle = this.fileHandle;

      // If no cached handle, open file picker
      if (!fileHandle) {
        const [selectedHandle] = await window.showOpenFilePicker({
          types: [
            {
              description: 'Money Tree Data',
              accept: {
                'application/json': ['.json'],
              },
            },
          ],
          multiple: false,
        });
        fileHandle = selectedHandle;

        // Cache the newly selected handle
        this.fileHandle = fileHandle;
        await this.saveCachedHandle(fileHandle);
      } else {
        // Verify permission for cached handle
        const hasPermission = await this.verifyPermission(fileHandle);
        if (!hasPermission) {
          // Permission denied, clear cached handle and throw error
          await this.clearFileHandle();
          throw new Error('Permission denied to access the file');
        }
      }

      // Read file content from the handle (cached or newly selected)
      const file = await fileHandle.getFile();
      const content = await file.text();

      // Parse and validate
      const data = JSON.parse(content);
      const validatedData = DataFileSchema.parse(data) as DataFile;

      return validatedData;
    } catch (error) {
      // User cancelled the picker
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Save data file
   * Opens a file picker for the user to select where to save
   */
  async saveDataFile(data: DataFile): Promise<void> {
    this.checkSupport();

    // Validate data before saving
    DataFileSchema.parse(data);

    try {
      // Try to use existing file handle if available
      let fileHandle = this.fileHandle;

      // If no existing handle, open save picker
      if (!fileHandle) {
        const currentYear = new Date().getFullYear();
        fileHandle = await window.showSaveFilePicker({
          suggestedName: `money-tree-${currentYear}.json`,
          types: [
            {
              description: 'Money Tree Data',
              accept: {
                'application/json': ['.json'],
              },
            },
          ],
        });
        this.fileHandle = fileHandle;
        await this.saveCachedHandle(fileHandle);
      } else {
        // Verify write permission for cached handle
        const options: FileSystemHandlePermissionDescriptor = { mode: 'readwrite' };
        if ((await fileHandle.queryPermission(options)) !== 'granted') {
          if ((await fileHandle.requestPermission(options)) !== 'granted') {
            // Permission denied, clear cached handle and throw error
            await this.clearFileHandle();
            throw new Error('Permission denied to write to the file');
          }
        }
      }

      // Write to file
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
    } catch (error) {
      // User cancelled the picker
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      throw error;
    }
  }

  /**
   * Clear cached file handle
   */
  async clearFileHandle(): Promise<void> {
    this.fileHandle = null;
    await this.removeCachedHandle();
  }

  /**
   * Get cached file handle status
   */
  hasFileHandle(): boolean {
    // Return true only if initialized and has handle
    return this.initialized && this.fileHandle !== null;
  }

  /**
   * Get the name of the cached file
   */
  getFileName(): string | null {
    return this.fileHandle?.name || null;
  }
}
