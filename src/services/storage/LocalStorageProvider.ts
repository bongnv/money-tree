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
    await writable.write(JSON.stringify(data));
    await writable.close();
  }

  /**
   * Get the name of the cached file
   */
  getFileName(): string {
    return this.fileHandle.name;
  }

  /**
   * Save a file (e.g., backup ZIP, archive JSON)
   * Shows file picker for user to select save location
   * @param data The data to save (string for JSON, Uint8Array for compressed/binary)
   * @param filename The suggested filename
   */
  async saveFile(data: string | Uint8Array, filename: string): Promise<void> {
    // Show save file picker with suggested name
    const { FilePickerService } = await import('./FilePickerService');

    const fileHandle = await FilePickerService.showSaveFilePicker(filename);

    if (!fileHandle) {
      throw new Error('File save cancelled');
    }

    // Write data to file
    const writable = await fileHandle.createWritable();
    // Cast Uint8Array to avoid TypeScript incompatibility with SharedArrayBuffer
    await writable.write(data instanceof Uint8Array ? (data as Uint8Array<ArrayBuffer>) : data);
    await writable.close();
  }
}
