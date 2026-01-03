import type { DataFile } from '../../types/models';
import { DataFileSchema } from '../../schemas/models.schema';
import type { IStorageProvider } from './IStorageProvider';

/**
 * Local storage provider using File System Access API
 * Implements file-based storage on the user's local machine
 */
export class LocalStorageProvider implements IStorageProvider {
  private fileHandle: FileSystemFileHandle | null = null;

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
   * Opens a file picker for the user to select the file
   */
  async loadDataFile(): Promise<DataFile | null> {
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
      const validatedData = DataFileSchema.parse(data) as DataFile;

      // Store file handle for future saves
      this.fileHandle = fileHandle;

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
   * For local storage with multi-year files, this would require loading the file
   * Returns empty array as we don't track individual years
   */
  async listAvailableYears(): Promise<number[]> {
    return [];
  }

  /**
   * Clear cached file handle
   */
  clearFileHandle(): void {
    this.fileHandle = null;
  }

  /**
   * Get cached file handle status
   */
  hasFileHandle(): boolean {
    return this.fileHandle !== null;
  }
}
