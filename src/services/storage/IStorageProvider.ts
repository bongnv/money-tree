import type { DataFile } from '../../types/models';

/**
 * Storage provider interface
 * Defines the contract for storage implementations (local, OneDrive, Google Drive, etc.)
 */
export interface IStorageProvider {
  /**
   * Load multi-year data file
   * @returns Promise with the data file, or null if file doesn't exist
   * @throws Error if loading fails
   */
  loadDataFile(): Promise<DataFile | null>;

  /**
   * Save multi-year data file
   * @param data The data file to save
   * @throws Error if saving fails
   */
  saveDataFile(data: DataFile): Promise<void>;

  /**
   * Check if a file handle is cached
   * @returns True if file handle exists, false otherwise
   */
  hasFileHandle?(): boolean;

  /**
   * Clear cached file handle
   */
  clearFileHandle?(): void | Promise<void>;

  /**
   * Get the name of the current file
   * @returns File name or null if no file is open
   */
  getFileName?(): string | null;

  /**
   * Ensure any async initialization is complete
   * Call this before checking hasFileHandle() or other operations
   */
  ensureInitialized?(): Promise<void>;
}
