import type { IStorageProvider } from './IStorageProvider';
import type { DataFile, ArchiveFile } from '../../types/models';
import { DataFileSchema } from '../../schemas/models.schema';
import { graphConfig, errorMessages } from '../../config/onedrive.config';
import type { OneDriveService } from './OneDriveService';

/**
 * OneDrive Storage Provider
 * Uses Microsoft Graph API to store data in OneDrive
 */
export interface SelectedFileInfo {
  fileId: string | null; // null for new files, actual ID for existing files
  filePath: string; // Full path including filename
  // For shared folders: need driveId and parent folder ID
  driveId?: string;
  parentItemId?: string;
}

export class OneDriveProvider implements IStorageProvider {
  private selectedFileInfo: SelectedFileInfo;

  constructor(
    private service: OneDriveService,
    fileInfo: SelectedFileInfo
  ) {
    this.selectedFileInfo = fileInfo;
  }

  /**
   * Extract file name from file path
   */
  getFileName(): string {
    return this.selectedFileInfo.filePath.split('/').pop() || 'money-tree.json';
  }

  /**
   * Get file content URL based on selected file or default path
   */
  private getFileUrl(): string {
    if (this.selectedFileInfo.fileId) {
      // For shared folders, use drives endpoint
      if (this.selectedFileInfo.driveId) {
        return `/drives/${this.selectedFileInfo.driveId}/items/${this.selectedFileInfo.fileId}/content`;
      }
      // For personal drive, use me endpoint
      return `/me/drive/items/${this.selectedFileInfo.fileId}/content`;
    }
    // Use default path for new files
    return graphConfig.getFileContentUrl();
  }

  /**
   * Get file upload URL based on selected file
   */
  private getUploadUrl(): string {
    if (!this.selectedFileInfo.fileId) {
      // Create new file
      if (this.selectedFileInfo.driveId && this.selectedFileInfo.parentItemId) {
        // Shared folder: use drives endpoint
        return `/drives/${this.selectedFileInfo.driveId}/items/${this.selectedFileInfo.parentItemId}:/${this.getFileName()}:/content`;
      } else {
        // Personal drive: use root path
        return `/me/drive/root:/${this.selectedFileInfo.filePath}:/content`;
      }
    } else {
      // Update existing file by ID (works for both personal and shared)
      return `/me/drive/items/${this.selectedFileInfo.fileId}/content`;
    }
  }

  /**
   * Load data file from OneDrive
   */
  async loadDataFile(): Promise<DataFile | null> {
    try {
      // Download file content (will wait for initialization and check auth)
      const response = await this.service.readFile(this.getFileUrl());

      // Parse and validate
      const data = typeof response === 'string' ? JSON.parse(response) : response;
      const validatedData = DataFileSchema.parse(data) as DataFile;

      return validatedData;
    } catch (error: any) {
      // File doesn't exist yet (404)
      if (error.statusCode === 404) {
        return null;
      }

      console.error('Failed to load file from OneDrive:', error);

      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new Error(
          'OneDrive permission expired. Please reconnect your account in Settings → Data & Sync.'
        );
      }

      throw new Error(errorMessages.downloadFailed);
    }
  }

  /**
   * Save data file to OneDrive
   */
  async saveDataFile(data: DataFile): Promise<void> {
    // Validate data before saving
    DataFileSchema.parse(data);

    try {
      const content = JSON.stringify(data, null, 2);

      // Upload file content
      const response = await this.service.writeFile(this.getUploadUrl(), content);

      // If this was a new file, update the file ID
      if (!this.selectedFileInfo.fileId) {
        this.selectedFileInfo.fileId = response.id;
      }
    } catch (error: any) {
      console.error('Failed to save file to OneDrive:', error);

      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new Error(
          'OneDrive permission expired. Please reconnect your account in Settings → Data & Sync.'
        );
      }

      throw new Error(errorMessages.uploadFailed);
    }
  }

  /**
   * Save archive file to OneDrive
   * File info must be provided (from external file picker)
   * @param archiveFile The archive file to save
   * @param fileInfo The selected file information (from FilePickerService)
   */
  async saveArchiveFile(archiveFile: ArchiveFile): Promise<void> {
    // Auto-generate archive file name next to main file
    const mainFileName = this.getFileName();
    const archiveFileName = mainFileName.replace('.json', `-${archiveFile.year}.json`);

    const content = JSON.stringify(archiveFile, null, 2);

    let uploadPath: string;

    if (this.selectedFileInfo.driveId && this.selectedFileInfo.parentItemId) {
      // Shared folder: use drives endpoint
      uploadPath = `/drives/${this.selectedFileInfo.driveId}/items/${this.selectedFileInfo.parentItemId}:/${archiveFileName}:/content`;
    } else {
      // Personal drive: use root path
      const mainPath = this.selectedFileInfo.filePath;
      const archivePath = mainPath.substring(0, mainPath.lastIndexOf('/') + 1) + archiveFileName;
      uploadPath = archivePath.startsWith('/')
        ? `/me/drive/root:${archivePath}:/content`
        : `/me/drive/root:/${archivePath}:/content`;
    }

    await this.service.writeFile(uploadPath, content);
  }
}
