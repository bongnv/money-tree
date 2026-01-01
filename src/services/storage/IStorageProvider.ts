import type { DataFile } from '../../types/models';

/**
 * Storage provider interface
 * Defines the contract for storage implementations (local, OneDrive, Google Drive, etc.)
 */
export interface IStorageProvider {
  /**
   * Load data file for a specific year
   * @param year The year to load data for
   * @returns Promise with the data file, or null if file doesn't exist
   * @throws Error if loading fails
   */
  loadDataFile(year: number): Promise<DataFile | null>;

  /**
   * Save data file for a specific year
   * @param year The year to save data for
   * @param data The data file to save
   * @throws Error if saving fails
   */
  saveDataFile(year: number, data: DataFile): Promise<void>;

  /**
   * List all available years that have data files
   * @returns Promise with array of years
   */
  listAvailableYears(): Promise<number[]>;
}

