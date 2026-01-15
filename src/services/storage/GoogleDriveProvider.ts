import type { IStorageProvider } from './IStorageProvider';
import type { DataFile } from '../../types/models';
import { DataFileSchema } from '../../schemas/models.schema';
import type { GoogleDriveService } from './GoogleDriveService';

/**
 * Google Drive Storage Provider
 * Uses Google Drive API to store data in Google Drive
 */
export interface SelectedFileInfo {
  fileId: string | null; // null for new files, actual ID for existing files
  fileName: string; // File name
  parentId?: string; // Parent folder ID (optional, defaults to root)
}

export class GoogleDriveProvider implements IStorageProvider {
  private selectedFileInfo: SelectedFileInfo;

  constructor(
    private service: GoogleDriveService,
    fileInfo: SelectedFileInfo
  ) {
    this.selectedFileInfo = fileInfo;
  }

  /**
   * Get file name
   */
  getFileName(): string {
    return this.selectedFileInfo.fileName || 'money-tree.json';
  }

  getName(): string {
    return 'Google Drive';
  }

  /**
   * Load data file from Google Drive
   */
  async loadDataFile(): Promise<DataFile | null> {
    if (!this.selectedFileInfo.fileId) {
      throw new Error(
        'Cannot load file: fileId is not set. Use saveDataFile() to create a new file.'
      );
    }

    try {
      // Download file content
      const content = await this.service.readFile(this.selectedFileInfo.fileId);

      // Parse and validate
      const data = JSON.parse(content);
      const validatedData = DataFileSchema.parse(data) as DataFile;

      return validatedData;
    } catch (error: any) {
      // File doesn't exist (404) - expected for new files
      if (error.message?.includes('File not found')) {
        return null;
      }

      // Auth errors - provide user-friendly message
      if (error.message?.includes('Authentication expired')) {
        throw new Error(
          'Google Drive permission expired. Please reconnect your account in Settings → Data & Sync.'
        );
      }

      // Let all other errors bubble up
      throw error;
    }
  }

  /**
   * Save data file to Google Drive
   */
  async saveDataFile(data: DataFile): Promise<void> {
    // Validate data before saving
    DataFileSchema.parse(data);

    try {
      const content = JSON.stringify(data);

      if (this.selectedFileInfo.fileId) {
        // Update existing file
        await this.service.updateFile(this.selectedFileInfo.fileId, content);
      } else {
        // Create new file
        const file = await this.service.createFile(
          this.selectedFileInfo.fileName,
          content,
          this.selectedFileInfo.parentId
        );

        // Update file ID for future saves
        this.selectedFileInfo.fileId = file.id;
      }
    } catch (error: any) {
      // Auth errors - provide user-friendly message
      if (error.message?.includes('Authentication expired')) {
        throw new Error(
          'Google Drive permission expired. Please reconnect your account in Settings → Data & Sync.'
        );
      }

      // Let all other errors bubble up
      throw error;
    }
  }

  /**
   * Save a file (e.g., backup ZIP, archive JSON) to Google Drive
   * Saves in the same folder as the main file
   * @param data The data to save (string for JSON, Blob for compressed/binary)
   * @param filename The filename to use
   */
  async saveFile(data: string | Blob, filename: string): Promise<void> {
    try {
      // Create file in the same folder as the main file
      await this.service.createFile(filename, data, this.selectedFileInfo.parentId);
    } catch (error: any) {
      // Auth errors - provide user-friendly message
      if (error.message?.includes('Authentication expired')) {
        throw new Error(
          'Google Drive permission expired. Please reconnect your account in Settings → Data & Sync.'
        );
      }

      // Let all other errors bubble up
      throw error;
    }
  }
}
