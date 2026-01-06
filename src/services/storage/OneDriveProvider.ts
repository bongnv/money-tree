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
  fileId: string;
  filePath: string;
  fileName: string;
  isNew: boolean;
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
   * Get file content URL based on selected file or default path
   */
  private getFileUrl(): string {
    if (this.selectedFileInfo.fileId !== 'new') {
      // Use specific file ID
      return `/me/drive/items/${this.selectedFileInfo.fileId}/content`;
    }
    // Use default path for new files
    return graphConfig.getFileContentUrl();
  }

  /**
   * Get file upload URL based on selected file
   */
  private getUploadUrl(): string {
    if (this.selectedFileInfo.isNew || this.selectedFileInfo.fileId === 'new') {
      // Create new file at specified path
      return `/me/drive/root:/${this.selectedFileInfo.filePath}:/content`;
    } else {
      // Update existing file by ID
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
      if (this.selectedFileInfo.isNew) {
        this.selectedFileInfo.fileId = response.id;
        this.selectedFileInfo.isNew = false;
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
   * Get file name
   */
  getFileName(): string {
    return this.selectedFileInfo.fileName;
  }

  /**
   * Save archive file to OneDrive
   * File info must be provided (from external file picker)
   * @param archiveFile The archive file to save
   * @param fileInfo The selected file information (from FilePickerService)
   */
  async saveArchiveFile(archiveFile: ArchiveFile, fileInfo?: SelectedFileInfo): Promise<void> {
    if (!fileInfo) {
      throw new Error('No file info provided for archive save.');
    }

    const content = JSON.stringify(archiveFile, null, 2);

    // Upload to OneDrive
    const uploadPath = fileInfo.filePath.startsWith('/')
      ? `/me/drive/root:${fileInfo.filePath}:/content`
      : `/me/drive/root:/${fileInfo.filePath}:/content`;

    await this.service.writeFile(uploadPath, content);
  }
}
