import type { DataFile } from '../../types/models';
import { DataFileSchema } from '../../schemas/models.schema';
import type { IStorageProvider } from './IStorageProvider';

/**
 * Local storage provider using File System Access API
 * Implements file-based storage on the user's local machine
 */
export class LocalStorageProvider implements IStorageProvider {
  private fileHandles: Map<number, FileSystemFileHandle> = new Map();

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
   * Load data file for a specific year
   * Opens a file picker for the user to select the file
   */
  async loadDataFile(year: number): Promise<DataFile | null> {
    this.checkSupport();

    try {
      // Open file picker
      const [fileHandle] = await window.showOpenFilePicker({
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

      // Read file content
      const file = await fileHandle.getFile();
      const content = await file.text();

      // Parse and validate
      const data = JSON.parse(content);
      const validatedData = DataFileSchema.parse(data);

      // Verify year matches
      if (validatedData.year !== year) {
        throw new Error(`File year mismatch: expected ${year}, got ${validatedData.year}`);
      }

      // Store file handle for future saves
      this.fileHandles.set(year, fileHandle);

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
   * Save data file for a specific year
   * Opens a file picker for the user to select where to save
   */
  async saveDataFile(year: number, data: DataFile): Promise<void> {
    this.checkSupport();

    // Validate data before saving
    DataFileSchema.parse(data);

    try {
      // Try to use existing file handle if available
      let fileHandle = this.fileHandles.get(year);

      // If no existing handle, open save picker
      if (!fileHandle) {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: `money-tree-${year}.json`,
          types: [
            {
              description: 'Money Tree Data',
              accept: {
                'application/json': ['.json'],
              },
            },
          ],
        });
        this.fileHandles.set(year, fileHandle);
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
   * List all available years that have data files
   * For local storage, this returns years with cached file handles
   * Note: This is limited as we can't scan the user's filesystem
   */
  async listAvailableYears(): Promise<number[]> {
    return Array.from(this.fileHandles.keys()).sort((a, b) => b - a);
  }

  /**
   * Clear cached file handle for a year
   */
  clearFileHandle(year: number): void {
    this.fileHandles.delete(year);
  }

  /**
   * Clear all cached file handles
   */
  clearAllFileHandles(): void {
    this.fileHandles.clear();
  }
}
