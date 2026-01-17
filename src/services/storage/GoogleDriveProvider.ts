import {
  googleDriveConfig,
  driveApiConfig,
  errorMessages,
  isGoogleDriveConfigured,
} from '../../config/googledrive.config';
import type { IStorageProvider } from './IStorageProvider';

const TOKEN_STORAGE_KEY = 'moneyTree.googleDrive.token';
const FILE_INFO_CACHE_KEY = 'moneyTree.googleDriveFileInfo';

/**
 * Google Drive file info
 */
export interface GoogleDriveFileInfo {
  fileId: string | null; // null for new files
  fileName: string; // File name
  parentId?: string; // Parent folder ID (optional, defaults to root)
}

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
 * Google Drive Storage Provider
 * Uses Google Drive API to store data in Google Drive
 * Manages its own file state and caching via localStorage
 */
export class GoogleDriveProvider implements IStorageProvider {
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private cachedToken: CachedToken | null = null;
  private initPromise: Promise<void> | null = null;
  private currentFileInfo: GoogleDriveFileInfo | null = null;

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
   * Set the main file to work with
   */
  async setFile(fileInfo: GoogleDriveFileInfo): Promise<void> {
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

    const token = await this.getAccessToken();
    const url = `${driveApiConfig.apiBaseUrl}/files/${this.currentFileInfo.fileId}?alt=media`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw this.createFriendlyError(response.status);
    }

    return await response.text();
  }

  /**
   * Write to main file
   */
  async writeMainFile(content: string): Promise<void> {
    if (!this.currentFileInfo) {
      throw new Error('No file selected. Please select a file first.');
    }

    if (this.currentFileInfo.fileId) {
      // Update existing file
      await this.updateFile(this.currentFileInfo.fileId, content);
    } else {
      // Create new file
      const file = await this.createFile(
        this.currentFileInfo.fileName,
        content,
        this.currentFileInfo.parentId
      );
      this.currentFileInfo = { ...this.currentFileInfo, fileId: file.id };
      this.saveFileInfoToCache(this.currentFileInfo);
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

    await this.createFile(filename, content, this.currentFileInfo.parentId);
  }

  /**
   * Get main file name
   */
  getMainFileName(): string | null {
    return this.currentFileInfo?.fileName ?? null;
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
   * Clear cached file
   */
  async clearCache(): Promise<void> {
    this.currentFileInfo = null;
    localStorage.removeItem(FILE_INFO_CACHE_KEY);
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
  private async createFile(
    name: string,
    content: string | Blob,
    parentId?: string
  ): Promise<DriveFile> {
    const token = await this.getAccessToken();

    const metadata = {
      name,
      mimeType: driveApiConfig.jsonMimeType,
      ...(parentId && { parents: [parentId] }),
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    if (typeof content === 'string') {
      form.append('file', new Blob([content], { type: driveApiConfig.jsonMimeType }));
    } else {
      form.append('file', content);
    }

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
  private async updateFile(fileId: string, content: string | Blob): Promise<DriveFile> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${driveApiConfig.uploadUrl}/${fileId}?uploadType=media&fields=id,name,mimeType,parents`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': driveApiConfig.jsonMimeType,
        },
        body: content as BodyInit,
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

  /**
   * Load file info from localStorage
   */
  private loadFileInfoFromCache(): GoogleDriveFileInfo | null {
    try {
      const cached = localStorage.getItem(FILE_INFO_CACHE_KEY);
      if (!cached) {
        return null;
      }
      return JSON.parse(cached) as GoogleDriveFileInfo;
    } catch (error) {
      console.warn('Failed to load cached Google Drive file info:', error);
      return null;
    }
  }

  /**
   * Save file info to localStorage
   */
  private saveFileInfoToCache(fileInfo: GoogleDriveFileInfo): void {
    try {
      localStorage.setItem(FILE_INFO_CACHE_KEY, JSON.stringify(fileInfo));
    } catch (error) {
      console.warn('Failed to cache Google Drive file info:', error);
    }
  }
}
