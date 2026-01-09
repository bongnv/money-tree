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
   * Save a file (e.g., backup ZIP, archive JSON)
   * Provider handles showing file picker (Local) or determining location (OneDrive)
   * @param data The data to save (string for JSON, Uint8Array for compressed/binary)
   * @param filename The suggested filename
   * @throws Error if saving fails or user cancels
   */
  saveFile(data: string | Uint8Array, filename: string): Promise<void>;

  /**
   * Get the name of the current file
   */
  getFileName(): string;

  /**
   * Get a user-friendly name for this storage provider
   * @returns Display name (e.g., "Local File", "OneDrive", "Google Drive")
   */
  getName(): string;
}
