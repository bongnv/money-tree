import {
  googleDriveConfig,
  driveApiConfig,
  errorMessages,
  isGoogleDriveConfigured,
} from '../../config/googledrive.config';
import type { IStorageProvider, CloudItem } from './IStorageProvider';

const TOKEN_STORAGE_KEY = 'moneyTree.googleDrive.token';

/**
 * Drive file metadata
 */
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  trashed?: boolean;
  modifiedTime?: string;
  shared?: boolean;
}

/**
 * Cached token info
 */
interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

/**
 * Google Drive Storage Provider - Stateless
 * Uses Google Drive API to store data in Google Drive
 * File state is managed by SyncContext, not by the provider
 */
export class GoogleDriveProvider implements IStorageProvider {
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private cachedToken: CachedToken | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    if (isGoogleDriveConfigured()) {
      this.initPromise = this.initializeGapi();
    }
  }

  /**
   * Initialize Google Identity Services
   */
  private async initializeGapi(): Promise<void> {
    // Load Google Identity Services library if not already loaded
    if (!window.google?.accounts?.oauth2) {
      await this.loadGoogleIdentityServices();
    }

    // Load cached token
    this.loadCachedToken();

    // Initialize token client
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: googleDriveConfig.clientId,
      scope: googleDriveConfig.scopes.join(' '),
      callback: () => {},
      error_callback: () => {},
    });
  }

  /**
   * Load Google Identity Services library dynamically
   */
  private loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize provider - verify authentication only
   */
  async initialize(): Promise<boolean> {
    await this.initPromise;

    // Check if authenticated
    if (!this.cachedToken || this.cachedToken.expiresAt <= Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Authenticate with Google using popup flow
   */
  async authenticate(): Promise<void> {
    await this.initPromise;

    // Already authenticated with valid token
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return;
    }

    if (!this.tokenClient) {
      throw new Error(errorMessages.configError);
    }

    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error(errorMessages.configError));
        return;
      }

      this.tokenClient.callback = (response: google.accounts.oauth2.TokenResponse) => {
        if (response.access_token) {
          this.cacheToken(response.access_token, response.expires_in || 3600);
          resolve();
        } else if (response.error) {
          console.error('[GoogleDrive] Authentication error:', response.error);
          reject(new Error(response.error));
        } else {
          reject(new Error('user_cancelled'));
        }
      };

      this.tokenClient.error_callback = (
        errorResponse: google.accounts.oauth2.ClientConfigError
      ) => {
        if (errorResponse.type === 'popup_closed') {
          reject(new Error('user_cancelled'));
        } else if (errorResponse.type === 'popup_failed_to_open') {
          reject(new Error('Popup failed to open. Please check your browser settings.'));
        } else {
          reject(new Error(errorResponse.message || 'Authentication failed'));
        }
      };

      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  /**
   * Read file content
   */
  async readFile(fileItem: CloudItem): Promise<Blob> {
    if (!fileItem?.id) {
      throw new Error('Cannot read file: file id is missing');
    }

    const token = await this.getAccessToken();
    const url = `${driveApiConfig.apiBaseUrl}/files/${fileItem.id}?alt=media`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw this.createFriendlyError(response.status);
    }

    return await response.blob();
  }

  /**
   * Write to file - creates new file or updates existing
   * Returns updated CloudItem with id populated for new files
   */
  async writeFile(fileItem: CloudItem, content: Blob): Promise<CloudItem> {
    if (!fileItem) {
      throw new Error('No file item provided');
    }

    if (fileItem.id) {
      // Update existing file
      await this.updateFile(fileItem.id, content);
      return fileItem;
    } else {
      // Create new file
      const file = await this.createFile(fileItem.name, content, fileItem.parentItemId);
      return { ...fileItem, id: file.id };
    }
  }

  /**
   * List files in Google Drive - returns full DriveFile objects for picker
   */
  async listDriveFiles(parentId?: string): Promise<DriveFile[]> {
    const token = await this.getAccessToken();

    let q = 'trashed = false';
    if (parentId) {
      q += ` and '${parentId}' in parents`;
    } else {
      q += " and 'root' in parents";
    }

    const url = new URL(`${driveApiConfig.apiBaseUrl}/files`);
    url.searchParams.append('q', q);
    url.searchParams.append('fields', 'files(id,name,mimeType,parents,modifiedTime,shared)');
    url.searchParams.append('orderBy', 'folder,name');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw this.createFriendlyError(response.status);
    }

    const data = await response.json();
    return data.files || [];
  }

  getName(): string {
    return 'Google Drive';
  }

  /**
   * List items for file picker - returns CloudItems with Google Drive-specific info
   */
  async listItems(parent?: CloudItem): Promise<CloudItem[]> {
    const driveFiles = await this.listDriveFiles(parent?.id);

    // Convert to generic CloudItem format with metadata
    return driveFiles.map((file) => ({
      id: file.id,
      name: file.name,
      isFolder: file.mimeType === driveApiConfig.folderMimeType,
      isSharedWithMe: file.shared,
      parentItemId: parent?.id || file.parents?.[0],
    }));
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Get valid access token
   */
  private async getAccessToken(): Promise<string> {
    await this.initPromise;

    if (!this.cachedToken || this.cachedToken.expiresAt <= Date.now()) {
      throw new Error(errorMessages.authRequired);
    }

    return this.cachedToken.accessToken;
  }

  /**
   * Load cached token from localStorage
   */
  private loadCachedToken(): void {
    try {
      const cached = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (cached) {
        const token: CachedToken = JSON.parse(cached);
        if (token.expiresAt > Date.now()) {
          this.cachedToken = token;
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to load cached token:', error);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  /**
   * Cache token in localStorage
   */
  private cacheToken(accessToken: string, expiresIn: number): void {
    const expiresAt = Date.now() + expiresIn * 1000;
    const token: CachedToken = { accessToken, expiresAt };

    this.cachedToken = token;
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
  }

  /**
   * Create a new file in Google Drive
   */
  private async createFile(name: string, content: Blob, parentId?: string): Promise<DriveFile> {
    const token = await this.getAccessToken();

    const metadata = {
      name,
      mimeType: driveApiConfig.jsonMimeType,
      ...(parentId && { parents: [parentId] }),
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', content);

    const response = await fetch(
      `${driveApiConfig.uploadUrl}?uploadType=multipart&fields=id,name,mimeType,parents`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      throw this.createFriendlyError(response.status);
    }

    return await response.json();
  }

  /**
   * Update existing file in Google Drive
   */
  private async updateFile(fileId: string, content: Blob): Promise<DriveFile> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${driveApiConfig.uploadUrl}/${fileId}?uploadType=media&fields=id,name,mimeType,parents`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': driveApiConfig.jsonMimeType,
        },
        body: content,
      }
    );

    if (!response.ok) {
      throw this.createFriendlyError(response.status);
    }

    return await response.json();
  }

  /**
   * Create user-friendly error messages
   */
  private createFriendlyError(statusCode: number): Error {
    switch (statusCode) {
      case 401:
        return new Error('Authentication expired. Please reconnect to Google Drive.');
      case 403:
        return new Error(errorMessages.permissionDenied);
      case 404:
        return new Error('File not found in Google Drive.');
      default:
        return new Error(errorMessages.networkError);
    }
  }
}
