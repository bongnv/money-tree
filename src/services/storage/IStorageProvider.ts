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
   * List all available years in the data file
   * @returns Promise with array of years
   */
  listAvailableYears(): Promise<number[]>;

  /**
   * Check if a file handle is cached
   * @returns True if file handle exists, false otherwise
   */
  hasFileHandle?(): boolean;

  /**
   * Clear cached file handle
   */
  clearFileHandle?(): void;
}
