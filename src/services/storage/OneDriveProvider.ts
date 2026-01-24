import {
  PublicClientApplication,
  AccountInfo,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import {
  msalConfig,
  loginRequest,
  errorMessages,
  isOneDriveConfigured,
} from '../../config/onedrive.config';
import type { IStorageProvider } from './IStorageProvider';

const CACHE_KEY = 'moneyTree.oneDriveFileInfo';

/**
 * OneDrive Storage Provider
 * Uses Microsoft Graph API to store data in OneDrive
 * Manages its own file state and caching via localStorage
 */
export interface OneDriveFileInfo {
  fileId: string | null; // null for new files, actual ID for existing files
  filePath: string; // Full path including filename
  // For shared folders: need driveId and parent folder ID
  driveId?: string;
  parentItemId?: string;
}

export interface DriveItem {
  id: string;
  name: string;
  folder?: { childCount: number };
  file?: { mimeType: string };
  parentReference?: {
    id: string;
    path: string;
    driveId?: string;
  };
  remoteItem?: {
    id: string;
    name: string;
    parentReference?: {
      driveId: string;
    };
  };
}

export class OneDriveProvider implements IStorageProvider {
  private msalInstance: PublicClientApplication | null = null;
  private graphClient: Client | null = null;
  private account: AccountInfo | null = null;
  private initPromise: Promise<void> | null = null;
  private currentFileInfo: OneDriveFileInfo | null = null;

  constructor() {
    if (isOneDriveConfigured()) {
      this.msalInstance = new PublicClientApplication(msalConfig);
      this.initPromise = this.initializeMsal();
    }
  }

  /**
   * Initialize MSAL instance and check for cached account
   */
  private async initializeMsal(): Promise<void> {
    if (!this.msalInstance) return;

    await this.msalInstance.initialize();

    // Check for cached account
    const account = this.msalInstance.getActiveAccount() || this.msalInstance.getAllAccounts()[0];
    if (account) {
      this.account = account;
      this.msalInstance.setActiveAccount(account);
    }
  }

  /**
   * Initialize provider - load cached file and verify authentication
   */
  async initialize(): Promise<boolean> {
    await this.initPromise;

    // Load cached file info
    const fileInfo = this.loadFileInfoFromCache();
    if (!fileInfo) {
      return false;
    }

    this.currentFileInfo = fileInfo;

    // Check if authenticated
    if (!this.account) {
      return false;
    }

    return true;
  }

  /**
   * Authenticate with Microsoft using popup flow
   */
  async authenticate(): Promise<void> {
    await this.initPromise;

    // Already authenticated
    if (this.account !== null) {
      return;
    }

    if (!this.msalInstance) {
      throw new Error(errorMessages.configError);
    }

    const response = await this.msalInstance.loginPopup(loginRequest);
    this.account = response.account;
    this.msalInstance.setActiveAccount(response.account);
  }

  /**
   * Set the main file to work with
   */
  async setFile(fileInfo: OneDriveFileInfo): Promise<void> {
    this.currentFileInfo = fileInfo;
    this.saveFileInfoToCache(fileInfo);
  }

  /**
   * Read main file content
   */
  async readMainFile(): Promise<string> {
    if (!this.currentFileInfo) {
      throw new Error('No file selected. Please select a file first.');
    }

    if (!this.currentFileInfo.fileId) {
      throw new Error('Cannot read file: fileId is null');
    }

    try {
      const client = await this.getGraphClient();
      const endpoint = this.buildContentUrl(this.currentFileInfo, this.currentFileInfo.fileId);
      const response = await client.api(endpoint).get();
      return typeof response === 'string' ? response : JSON.stringify(response);
    } catch (error: any) {
      throw this.createFriendlyError(error);
    }
  }

  /**
   * Write to main file
   */
  async writeMainFile(content: string): Promise<void> {
    if (!this.currentFileInfo) {
      throw new Error('No file selected. Please select a file first.');
    }

    try {
      const client = await this.getGraphClient();
      const endpoint = this.buildUploadUrl(
        this.currentFileInfo,
        this.currentFileInfo.filePath,
        this.currentFileInfo.fileId
      );
      const response = await client.api(endpoint).put(content);

      // Update fileId if it was a new file
      if (!this.currentFileInfo.fileId) {
        this.currentFileInfo = { ...this.currentFileInfo, fileId: response.id };
        this.saveFileInfoToCache(this.currentFileInfo);
      }
    } catch (error: any) {
      throw this.createFriendlyError(error);
    }
  }

  /**
   * Save an additional file (backup, archive, etc.)
   * Saves in same folder as main file
   */
  async saveAdditionalFile(filename: string, content: string | Blob): Promise<void> {
    if (!this.currentFileInfo) {
      throw new Error('No file selected. Please select a file first.');
    }

    try {
      const client = await this.getGraphClient();

      // Create new file info in same folder as main file
      const folderPath = this.currentFileInfo.filePath.substring(
        0,
        this.currentFileInfo.filePath.lastIndexOf('/')
      );
      const newFilePath = folderPath ? `${folderPath}/${filename}` : filename;

      const newFileInfo: OneDriveFileInfo = {
        fileId: null,
        filePath: newFilePath,
        driveId: this.currentFileInfo.driveId,
        parentItemId: this.currentFileInfo.parentItemId,
      };

      const endpoint = this.buildUploadUrl(newFileInfo, newFilePath, null);
      await client.api(endpoint).put(content);
    } catch (error: any) {
      throw this.createFriendlyError(error);
    }
  }

  /**
   * Get main file name
   */
  getMainFileName(): string | null {
    if (!this.currentFileInfo) {
      return null;
    }
    return this.currentFileInfo.filePath.split('/').pop() || null;
  }

  /**
   * List folders and files in OneDrive - returns full DriveItem objects for picker
   */
  async listDriveItems(parentItem?: DriveItem): Promise<DriveItem[]> {
    try {
      const client = await this.getGraphClient();
      let items: DriveItem[] = [];

      if (!parentItem) {
        // Root folder - need to fetch both personal drive and shared items
        const [rootResponse, sharedResponse] = await Promise.all([
          client.api('/me/drive/root/children').get(),
          client.api('/me/drive/sharedWithMe').get(),
        ]);

        const rootItems = rootResponse.value || [];
        const sharedItems = sharedResponse.value || [];

        // Combine both lists
        items = [...rootItems, ...sharedItems];
      } else if (parentItem.remoteItem) {
        // Shared folder
        const driveId = parentItem.remoteItem.parentReference?.driveId;
        const itemId = parentItem.remoteItem.id;
        const endpoint = `/drives/${driveId}/items/${itemId}/children`;
        const response = await client.api(endpoint).get();
        items = response.value || [];
      } else {
        // Regular folder
        const endpoint = `/me/drive/items/${parentItem.id}/children`;
        const response = await client.api(endpoint).get();
        items = response.value || [];
      }

      return items;
    } catch (error: any) {
      throw this.createFriendlyError(error);
    }
  }

  getName(): string {
    return 'OneDrive';
  }

  /**
   * Clear cached file
   */
  async clearCache(): Promise<void> {
    this.currentFileInfo = null;
    localStorage.removeItem(CACHE_KEY);
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Get Graph client (creates lazily on first use)
   */
  private async getGraphClient(): Promise<Client> {
    await this.initPromise;

    if (!this.account) {
      throw new Error(errorMessages.authRequired);
    }

    if (!this.graphClient) {
      this.graphClient = await this.createGraphClient();
    }

    return this.graphClient;
  }

  /**
   * Create Microsoft Graph client with authentication
   */
  private async createGraphClient(): Promise<Client> {
    if (!this.account) {
      throw new Error(errorMessages.authRequired);
    }

    return Client.init({
      authProvider: async (done) => {
        try {
          const token = await this.getAccessToken();
          done(null, token);
        } catch (error) {
          done(error as Error, null);
        }
      },
    });
  }

  /**
   * Get access token (acquire silently or via interaction)
   */
  private async getAccessToken(): Promise<string> {
    if (!this.msalInstance || !this.account) {
      throw new Error(errorMessages.authRequired);
    }

    const request = {
      ...loginRequest,
      account: this.account,
    };

    try {
      const response = await this.msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const response = await this.msalInstance.acquireTokenPopup(request);
        return response.accessToken;
      }
      throw error;
    }
  }

  /**
   * Check if we're using a shared folder
   */
  private isSharedFolder(fileInfo: OneDriveFileInfo): boolean {
    return !!(fileInfo?.driveId && fileInfo?.parentItemId);
  }

  /**
   * Build file content URL (for reading)
   */
  private buildContentUrl(fileInfo: OneDriveFileInfo, fileId: string): string {
    if (this.isSharedFolder(fileInfo)) {
      return `/drives/${fileInfo.driveId}/items/${fileId}/content`;
    }
    return `/me/drive/items/${fileId}/content`;
  }

  /**
   * Build upload URL (for writing)
   */
  private buildUploadUrl(
    fileInfo: OneDriveFileInfo,
    filename: string,
    fileId?: string | null
  ): string {
    if (fileId) {
      return this.buildContentUrl(fileInfo, fileId);
    }

    const cleanPath = filename.replace(/^\/+|\/+$/g, '');
    if (!cleanPath) {
      throw new Error('Invalid filename: cannot be empty');
    }

    if (this.isSharedFolder(fileInfo)) {
      return `/drives/${fileInfo.driveId}/items/${fileInfo.parentItemId}:/${cleanPath}:/content`;
    }
    return `/me/drive/root:/${cleanPath}:/content`;
  }

  /**
   * Create user-friendly error messages from Graph API errors
   */
  private createFriendlyError(error: any): Error {
    // Log the original error first to preserve debugging information
    console.error('OneDrive API error:', error);

    const statusCode = error?.statusCode;
    const code = error?.code;
    const message = error?.message;

    if (statusCode === 401 || code === 'InvalidAuthenticationToken') {
      return new Error('Authentication expired. Please reconnect to OneDrive.');
    }

    if (statusCode === 403) {
      return new Error('Permission denied. Please check OneDrive permissions.');
    }

    if (statusCode === 404) {
      return new Error('Folder or file not found.');
    }

    return new Error(message || 'OneDrive operation failed');
  }

  /**
   * Load file info from localStorage
   */
  private loadFileInfoFromCache(): OneDriveFileInfo | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        return null;
      }
      return JSON.parse(cached) as OneDriveFileInfo;
    } catch (error) {
      console.warn('Failed to load cached OneDrive file info:', error);
      return null;
    }
  }

  /**
   * Save file info to localStorage
   */
  private saveFileInfoToCache(fileInfo: OneDriveFileInfo): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(fileInfo));
    } catch (error) {
      console.warn('Failed to cache OneDrive file info:', error);
    }
  }
}
