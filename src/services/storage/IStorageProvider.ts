import type { DataFile, ArchiveFile } from '../../types/models';

/**
 * Storage provider interface
 * Defines the contract for storage implementations (local, OneDrive, Google Drive, etc.)
 *
 * File pickers should be shown BEFORE initializing the provider.
 * Providers should never show file pickers - they only work with provided file handles/info.
 */
export interface IStorageProvider {
  /**
   * Load multi-year data file from the configured file location
   * File handle/info must be set before calling this method
   * @returns Promise with the data file, or null if file doesn't exist
   * @throws Error if loading fails or no file is configured
   */
  loadDataFile(): Promise<DataFile | null>;

  /**
   * Save multi-year data file to the configured file location
   * File handle/info must be set before calling this method
   * @param data The data file to save
   * @throws Error if saving fails or no file is configured
   */
  saveDataFile(data: DataFile): Promise<void>;

  /**
   * Save archive file for a specific year
   * @param archiveFile The archive file to save
   * @param fileHandle Optional file handle for local storage (from external file picker)
   * @throws Error if saving fails
   */
  saveArchiveFile(archiveFile: ArchiveFile, fileHandle?: any): Promise<void>;

  /**
   * Get the name of the current file
   * @returns File name or null if no file is configured
   */
  getFileName(): string | null;
}
