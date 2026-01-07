import type { DataFile } from '../../types/models';
import { DataFileSchema } from '../../schemas/models.schema';
import type { IStorageProvider } from './IStorageProvider';

/**
 * Local storage provider using File System Access API
 * Implements file-based storage on the user's local machine
 * Note: File handle caching is managed by StorageFactory, not this provider
 */
export class LocalStorageProvider implements IStorageProvider {
  private fileHandle: FileSystemFileHandle;

  constructor(fileHandle: FileSystemFileHandle) {
    this.fileHandle = fileHandle;
  }

  /**
   * Check and request permission for a file handle
   * @returns true if permission granted, false otherwise
   */
  private async verifyPermission(fileHandle: FileSystemFileHandle): Promise<boolean> {
    const options: FileSystemHandlePermissionDescriptor = { mode: 'read' };

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
   * Load data file from the configured file handle
   */
  async loadDataFile(): Promise<DataFile | null> {
    // Verify permission for file handle
    const hasPermission = await this.verifyPermission(this.fileHandle);
    if (!hasPermission) {
      // Permission denied - throw error
      throw new Error('File permission expired. Please select the file again to grant permission.');
    }

    // Read file content from the handle
    const file = await this.fileHandle.getFile();
    const content = await file.text();

    // Parse and validate
    const data = JSON.parse(content);
    const validatedData = DataFileSchema.parse(data) as DataFile;

    return validatedData;
  }

  /**
   * Save data file to the configured file handle
   * File handle must be set before calling this method
   */
  async saveDataFile(data: DataFile): Promise<void> {
    // Validate data before saving
    DataFileSchema.parse(data);

    // Check write permission for file handle
    const options: FileSystemHandlePermissionDescriptor = { mode: 'readwrite' };
    let permission = await this.fileHandle.queryPermission(options);

    if (permission !== 'granted') {
      // Try to request permission (requires user activation like a click)
      try {
        permission = await this.fileHandle.requestPermission(options);
      } catch (error) {
        // Request failed (likely no user activation or user denied)
        console.warn('Failed to request write permission:', error);
      }

      // If still not granted, throw error
      if (permission !== 'granted') {
        throw new Error(
          'File permission expired. Please select the file again to grant permission.'
        );
      }
    }

    // Write to file
    const writable = await this.fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  }

  /**
   * Get the name of the cached file
   */
  getFileName(): string {
    return this.fileHandle.name;
  }

  /**
   * Save a blob file (e.g., backup ZIP, archive JSON)
   * Shows file picker for user to select save location
   * @param blob The blob data to save
   * @param filename The suggested filename
   */
  async saveFile(blob: Blob, filename: string): Promise<void> {
    // Show save file picker with suggested name
    const { FilePickerService } = await import('./FilePickerService');

    // Determine file type based on extension
    const isZip = filename.endsWith('.zip');
    const fileHandle = isZip
      ? await this.showZipSaveFilePicker(filename)
      : await FilePickerService.showSaveFilePicker(filename);

    if (!fileHandle) {
      throw new Error('File save cancelled');
    }

    // Write blob to file
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  /**
   * Show file picker for saving ZIP files
   * @param suggestedName - Suggested file name
   * @returns Selected file handle or null if cancelled
   */
  private async showZipSaveFilePicker(suggestedName: string): Promise<FileSystemFileHandle | null> {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'ZIP Archive',
            accept: {
              'application/zip': ['.zip'],
            },
          },
        ],
      });
      return fileHandle;
    } catch (error) {
      // User cancelled the picker
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }
}
