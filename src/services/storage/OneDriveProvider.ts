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
import type { IStorageProvider, CloudItem } from './IStorageProvider';

/**
 * OneDrive Storage Provider - Stateless
 * Uses Microsoft Graph API to store data in OneDrive
 * File state is managed by SyncContext, not by the provider
 */
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
   * Initialize provider - verify authentication only
   */
  async initialize(): Promise<boolean> {
    await this.initPromise;

    // Check if authenticated
    return this.account !== null;
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
   * Read file content
   */
  async readFile(fileItem: CloudItem): Promise<Blob> {
    if (!fileItem?.id) {
      throw new Error('Cannot read file: file id is missing');
    }

    try {
      const client = await this.getGraphClient();
      const endpoint = this.buildContentUrl(fileItem, fileItem.id);
      const response = await client.api(endpoint).get();
      const content = typeof response === 'string' ? response : JSON.stringify(response);
      return new Blob([content], { type: 'application/json' });
    } catch (error) {
      throw this.createFriendlyError(error);
    }
  }

  /**
   * Write to file - creates new file or updates existing
   * Returns updated CloudItem with id populated for new files
   */
  async writeFile(fileItem: CloudItem, content: Blob): Promise<CloudItem> {
    if (!fileItem) {
      throw new Error('No file item provided');
    }

    try {
      const client = await this.getGraphClient();
      const endpoint = this.buildUploadUrl(fileItem, fileItem.name, fileItem.id || null);
      const response = await client.api(endpoint).put(content);

      // Return updated CloudItem with new id if it was a new file
      if (!fileItem.id) {
        return { ...fileItem, id: response.id };
      }
      return fileItem;
    } catch (error) {
      throw this.createFriendlyError(error);
    }
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
    } catch (error) {
      throw this.createFriendlyError(error);
    }
  }

  getName(): string {
    return 'OneDrive';
  }

  /**
   * List items for file picker - returns CloudItems with OneDrive-specific info
   */
  async listItems(parent?: CloudItem): Promise<CloudItem[]> {
    // For root, pass undefined to listDriveItems
    // For nested folders, we need to reconstruct DriveItem-like structure
    // But since listDriveItems accepts DriveItem, we'll need to refactor it
    // For now, we'll store minimal info in parent and handle it
    const parentItem = parent ? this.cloudItemToDriveItem(parent) : undefined;
    const driveItems = await this.listDriveItems(parentItem);

    // Convert to generic CloudItem format with metadata
    return driveItems.map((item) => ({
      id: item.id,
      name: item.name,
      isFolder: !!item.folder,
      isSharedWithMe: !!item.remoteItem,
      parentItemId: item.parentReference?.id,
      driveId: item.remoteItem?.parentReference?.driveId || item.parentReference?.driveId,
    }));
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Convert CloudItem to minimal DriveItem structure for API calls
   */
  private cloudItemToDriveItem(item: CloudItem): DriveItem {
    const driveItem: DriveItem = {
      id: item.id,
      name: item.name,
    };

    if (item.isFolder) {
      driveItem.folder = { childCount: 0 };
    }

    if (item.isSharedWithMe && item.driveId) {
      driveItem.remoteItem = {
        id: item.id,
        name: item.name,
        parentReference: {
          driveId: item.driveId,
        },
      };
    }

    if (item.parentItemId) {
      driveItem.parentReference = {
        id: item.parentItemId,
        path: '',
        driveId: item.driveId,
      };
    }

    return driveItem;
  }

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
  private isSharedFolder(fileItem: CloudItem): boolean {
    return !!(fileItem?.driveId && fileItem?.parentItemId);
  }

  /**
   * Build file content URL (for reading)
   */
  private buildContentUrl(fileItem: CloudItem, fileId: string): string {
    if (this.isSharedFolder(fileItem)) {
      return `/drives/${fileItem.driveId}/items/${fileId}/content`;
    }
    return `/me/drive/items/${fileId}/content`;
  }

  /**
   * Build upload URL (for writing)
   */
  private buildUploadUrl(fileItem: CloudItem, filename: string, fileId?: string | null): string {
    if (fileId) {
      return this.buildContentUrl(fileItem, fileId);
    }

    const cleanPath = filename.replace(/^\/+|\/+$/g, '');
    if (!cleanPath) {
      throw new Error('Invalid filename: cannot be empty');
    }

    if (this.isSharedFolder(fileItem)) {
      return `/drives/${fileItem.driveId}/items/${fileItem.parentItemId}:/${cleanPath}:/content`;
    }
    return `/me/drive/root:/${cleanPath}:/content`;
  }

  /**
   * Create user-friendly error messages from Graph API errors
   */
  private createFriendlyError(error: unknown): Error {
    // Log the original error first to preserve debugging information
    console.error('OneDrive API error:', error);

    const statusCode = (error as { statusCode?: number })?.statusCode;
    const code = (error as { code?: string })?.code;
    const message = (error as { message?: string })?.message;

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
}
