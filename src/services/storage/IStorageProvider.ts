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
   * Clear cached file handle or sign out
   */
  clearFileHandle(): void | Promise<void>;

  /**
   * Get the name of the current file
   * @returns File name or null if no file is open
   */
  getFileName(): string | null;

  /**
   * Initialize the provider
   * Sets up necessary state, authentication, or resources
   * Should be called before any other operations
   */
  initialize(): Promise<void>;

  /**
   * Check if provider is ready to load/save data
   * @returns True if ready (has file handle, authenticated, etc.), false otherwise
   */
  isReady(): boolean;
}
