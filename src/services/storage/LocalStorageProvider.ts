import type { IStorageProvider } from './IStorageProvider';

const DB_NAME = 'MoneyTreeDB';
const DB_VERSION = 1;
const STORE_NAME = 'fileHandles';
const FILE_HANDLE_KEY = 'localFileHandle';

/**
 * Local storage provider using File System Access API
 * Manages its own file handle state and caching via IndexedDB
 */
export class LocalStorageProvider implements IStorageProvider {
  private currentFileHandle: FileSystemFileHandle | null = null;

  constructor() {}

  /**
   * Initialize - load cached file handle from IndexedDB and verify permissions
   * @returns true if file loaded and has valid permissions, false if needs reconnection
   */
  async initialize(): Promise<boolean> {
    try {
      const handle = await this.loadFileHandleFromIndexedDB();
      if (!handle) {
        return false;
      }

      // Check if we have read permission
      const hasPermission = await this.verifyPermission(handle, 'read');
      if (!hasPermission) {
        // Store the handle but return false to trigger reconnection
        this.currentFileHandle = handle;
        return false;
      }

      this.currentFileHandle = handle;
      return true;
    } catch (error) {
      console.warn('Failed to load cached file handle:', error);
      return false;
    }
  }

  /**
   * Request permission for the current file handle
   * Called when cached file handle loses permissions
   */
  async authenticate(): Promise<void> {
    if (!this.currentFileHandle) {
      throw new Error('No file handle available for permission request');
    }

    // Request both read and write permissions
    const hasReadPermission = await this.verifyPermission(this.currentFileHandle, 'read');
    if (!hasReadPermission) {
      throw new Error('Failed to obtain read permission for file');
    }

    const hasWritePermission = await this.verifyPermission(this.currentFileHandle, 'readwrite');
    if (!hasWritePermission) {
      throw new Error('Failed to obtain write permission for file');
    }
  }

  /**
   * Set file handle and cache it
   */
  async setFile(fileHandle: FileSystemFileHandle): Promise<void> {
    this.currentFileHandle = fileHandle;
    await this.saveFileHandleToIndexedDB(fileHandle);
  }

  /**
   * Read main file content
   */
  async readMainFile(): Promise<string> {
    if (!this.currentFileHandle) {
      throw new Error('No file selected. Please select a file first.');
    }

    // Verify permission for file handle
    const hasPermission = await this.verifyPermission(this.currentFileHandle, 'read');
    if (!hasPermission) {
      throw new Error('File permission expired. Please select the file again to grant permission.');
    }

    // Read file content
    const file = await this.currentFileHandle.getFile();
    return await file.text();
  }

  /**
   * Write to main file
   */
  async writeMainFile(content: string): Promise<void> {
    if (!this.currentFileHandle) {
      throw new Error('No file selected. Please select a file first.');
    }

    // Verify write permission for file handle
    const hasPermission = await this.verifyPermission(this.currentFileHandle, 'readwrite');
    if (!hasPermission) {
      throw new Error('File permission expired. Please select the file again to grant permission.');
    }

    // Write to file
    const writable = await this.currentFileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  /**
   * Save an additional file (backup, archive, etc.)
   * Shows file picker for user to choose location
   */
  async saveAdditionalFile(filename: string, content: string | Blob): Promise<void> {
    const { FilePickerService } = await import('./FilePickerService');
    const fileHandle = await FilePickerService.showSaveFilePicker(filename);

    if (!fileHandle) {
      throw new Error('File save cancelled');
    }

    // Verify write permission for file handle
    const hasPermission = await this.verifyPermission(fileHandle, 'readwrite');
    if (!hasPermission) {
      throw new Error('File permission expired. Please select the file again to grant permission.');
    }

    // Write to file
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  /**
   * Get main file name
   */
  getMainFileName(): string | null {
    return this.currentFileHandle?.name ?? null;
  }

  getName(): string {
    return 'Local File';
  }

  /**
   * Clear cached file handle
   */
  async clearCache(): Promise<void> {
    this.currentFileHandle = null;

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
      console.warn('Failed to clear IndexedDB cache:', error);
    }
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Check and request permission for a file handle
   */
  private async verifyPermission(
    fileHandle: FileSystemFileHandle,
    mode: 'read' | 'readwrite' = 'read'
  ): Promise<boolean> {
    const options: FileSystemHandlePermissionDescriptor = { mode };

    // Check if permission was already granted
    if ((await fileHandle.queryPermission(options)) === 'granted') {
      return true;
    }

    // Request permission - this requires user activation
    try {
      if ((await fileHandle.requestPermission(options)) === 'granted') {
        return true;
      }
    } catch (error) {
      // Failed to request permission (likely no user activation)
      console.warn('Failed to request permission:', error);
      return false;
    }

    return false;
  }

  /**
   * Get IndexedDB connection
   */
  private async getDB(): Promise<IDBDatabase> {
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
   * Save file handle to IndexedDB
   */
  private async saveFileHandleToIndexedDB(handle: FileSystemFileHandle): Promise<void> {
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
   * Load file handle from IndexedDB
   */
  private async loadFileHandleFromIndexedDB(): Promise<FileSystemFileHandle | null> {
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
}
