import type { DataFile } from '../../types/models';

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
   * Save a blob file (e.g., backup ZIP, archive JSON)
   * Provider handles showing file picker (Local) or determining location (OneDrive)
   * @param blob The blob data to save
   * @param filename The suggested filename
   * @throws Error if saving fails or user cancels
   */
  saveFile(blob: Blob, filename: string): Promise<void>;

  /**
   * Get the name of the current file
   */
  getFileName(): string;
}
