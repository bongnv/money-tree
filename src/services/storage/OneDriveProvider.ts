import type { IStorageProvider } from './IStorageProvider';
import type { DataFile } from '../../types/models';
import { DataFileSchema } from '../../schemas/models.schema';
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

  getName(): string {
    return 'OneDrive';
  }

  /**
   * Extract actual file path from Graph API format
   * Converts '/drive/root:/folder/file.json' to 'folder/file.json'
   * Or '/file.json' to 'file.json'
   */
  private extractActualPath(graphPath: string): string {
    // Remove Graph API prefixes like '/drive/root:' or just leading '/'
    const match = graphPath.match(/^\/drive\/root:(.+)$/);
    if (match) {
      return match[1].replace(/^\/+/, ''); // Remove leading slashes from extracted path
    }
    // Fallback: just remove leading slashes
    return graphPath.replace(/^\/+/, '');
  }

  /**
   * Check if we're using a shared folder
   */
  private isSharedFolder(): boolean {
    return !!(this.selectedFileInfo.driveId && this.selectedFileInfo.parentItemId);
  }

  /**
   * Build file content URL (for reading) - always uses file ID
   * @param fileId The OneDrive file ID
   * @returns Graph API endpoint for file content
   */
  private buildContentUrl(fileId: string): string {
    if (this.isSharedFolder()) {
      return `/drives/${this.selectedFileInfo.driveId}/items/${fileId}/content`;
    }
    return `/me/drive/items/${fileId}/content`;
  }

  /**
   * Build upload URL (for writing) - uses file ID if available, path otherwise
   * @param filename The file path to create/update
   * @param fileId Optional file ID to update existing file
   * @returns Graph API endpoint for upload
   */
  private buildUploadUrl(filename: string, fileId?: string | null): string {
    if (fileId) {
      // Update existing file by ID (more efficient)
      return this.buildContentUrl(fileId);
    }

    // Create new file by path
    const cleanPath = filename.replace(/^\/+|\/+$/g, '');
    if (!cleanPath) {
      throw new Error('Invalid filename: cannot be empty');
    }

    if (this.isSharedFolder()) {
      return `/drives/${this.selectedFileInfo.driveId}/items/${this.selectedFileInfo.parentItemId}:/${cleanPath}:/content`;
    }
    return `/me/drive/root:/${cleanPath}:/content`;
  }

  /**
   * Load data file from OneDrive
   */
  async loadDataFile(): Promise<DataFile | null> {
    if (!this.selectedFileInfo.fileId) {
      throw new Error(
        'Cannot load file: fileId is not set. Use saveDataFile() to create a new file.'
      );
    }

    try {
      // Download file content (will wait for initialization and check auth)
      const fileUrl = this.buildContentUrl(this.selectedFileInfo.fileId);
      const response = await this.service.readFile(fileUrl);

      // Parse and validate
      const data = typeof response === 'string' ? JSON.parse(response) : response;
      const validatedData = DataFileSchema.parse(data) as DataFile;

      return validatedData;
    } catch (error: any) {
      // File doesn't exist yet (404) - this is expected for new files
      if (error.statusCode === 404) {
        return null;
      }

      // HTTP auth errors - provide user-friendly message
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new Error(
          'OneDrive permission expired. Please reconnect your account in Settings → Data & Sync.'
        );
      }

      // Let all other errors (popup, auth, network, etc.) bubble up unchanged
      throw error;
    }
  }

  /**
   * Save data file to OneDrive
   */
  async saveDataFile(data: DataFile): Promise<void> {
    // Validate data before saving
    DataFileSchema.parse(data);

    try {
      // Upload file content
      const content = JSON.stringify(data);
      const uploadUrl = this.buildUploadUrl(
        this.selectedFileInfo.filePath,
        this.selectedFileInfo.fileId
      );
      const response = await this.service.writeFile(uploadUrl, content);

      // If this was a new file, update the file ID
      if (!this.selectedFileInfo.fileId) {
        this.selectedFileInfo.fileId = response.id;
      }
    } catch (error: any) {
      // HTTP auth errors - provide user-friendly message
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new Error(
          'OneDrive permission expired. Please reconnect your account in Settings → Data & Sync.'
        );
      }

      // Let all other errors bubble up unchanged
      throw error;
    }
  }

  /**
   * Save a file (e.g., backup ZIP, archive JSON) to OneDrive
   * Saves next to the main file in the same folder
   * @param data The data to save (string for JSON, Blob for compressed/binary)
   * @param filename The filename to use
   */
  async saveFile(data: string | Blob, filename: string): Promise<void> {
    // Extract the actual path (remove Graph API prefixes)
    const actualPath = this.extractActualPath(this.selectedFileInfo.filePath);

    // Determine the folder path from main file location
    const lastSlashIndex = actualPath.lastIndexOf('/');
    const folderPath = lastSlashIndex >= 0 ? actualPath.substring(0, lastSlashIndex) : '';

    // Build full path: folder/filename or just filename if in root
    const fullPath = folderPath ? `${folderPath}/${filename}` : filename;

    // Build upload URL (always creates new file, never uses fileId)
    const uploadPath = this.buildUploadUrl(fullPath, null);

    // Upload data directly
    await this.service.writeFile(uploadPath, data);
  }
}
