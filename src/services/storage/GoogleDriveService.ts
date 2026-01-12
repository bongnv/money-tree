import {
  googleDriveConfig,
  driveApiConfig,
  errorMessages,
  isGoogleDriveConfigured,
} from '../../config/googledrive.config';

/**
 * Google Drive file metadata
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
  expiresAt: number; // Timestamp when token expires
}

const TOKEN_STORAGE_KEY = 'moneyTree.googleDrive.token';

/**
 * Google Drive Service
 * Manages Google OAuth authentication and Drive API client
 * Singleton service shared across the application
 */
export class GoogleDriveService {
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private cachedToken: CachedToken | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    if (isGoogleDriveConfigured()) {
      this.initPromise = this.initialize();
    }
  }

  /**
   * Initialize Google Identity Services
   * Loads the Google Identity Services library and initializes the token client
   */
  private async initialize(): Promise<void> {
    // Load Google Identity Services library if not already loaded
    if (!window.google?.accounts?.oauth2) {
      await this.loadGoogleIdentityServices();
    }

    // Load cached token if available
    this.loadCachedToken();

    // Initialize token client (used for popup-based auth)
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: googleDriveConfig.clientId,
      scope: googleDriveConfig.scopes.join(' '),
      callback: (response: google.accounts.oauth2.TokenResponse) => {
        if (response.access_token) {
          this.cacheToken(response.access_token, response.expires_in || 3600);
        }
      },
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
   * Load cached token from localStorage
   */
  private loadCachedToken(): void {
    try {
      const cached = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (cached) {
        const token: CachedToken = JSON.parse(cached);
        // Only use cached token if it hasn't expired
        if (token.expiresAt > Date.now()) {
          this.cachedToken = token;
        } else {
          // Token expired, remove from cache
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
    // expiresIn is in seconds, convert to timestamp
    const expiresAt = Date.now() + expiresIn * 1000;
    const token: CachedToken = { accessToken, expiresAt };

    this.cachedToken = token;
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
  }

  /**
   * Check if authenticated (has valid cached token)
   */
  async isAuthenticated(): Promise<boolean> {
    await this.initPromise;
    return this.cachedToken !== null && this.cachedToken.expiresAt > Date.now();
  }

  /**
   * Authenticate with Google using popup flow
   * MUST be called during user interaction (button click) to avoid popup blocker
   * Idempotent - safe to call multiple times
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

    // Request new token via popup
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error(errorMessages.configError));
        return;
      }

      // Override callback for this specific auth request
      this.tokenClient.callback = (response: google.accounts.oauth2.TokenResponse) => {
        if (response.access_token) {
          this.cacheToken(response.access_token, response.expires_in || 3600);
          resolve();
        } else if (response.error) {
          reject(new Error(response.error));
        }
      };

      // Show popup
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  /**
   * Get valid access token (from cache or request new one)
   */
  private async getAccessTokenInternal(): Promise<string> {
    await this.initPromise;

    if (!this.cachedToken || this.cachedToken.expiresAt <= Date.now()) {
      throw new Error(errorMessages.authRequired);
    }

    return this.cachedToken.accessToken;
  }

  /**
   * Get cached access token for external use (e.g., Google Picker)
   * Returns null if not authenticated or token expired
   */
  getAccessToken(): string | null {
    if (!this.cachedToken || this.cachedToken.expiresAt <= Date.now()) {
      return null;
    }
    return this.cachedToken.accessToken;
  }

  /**
   * List files and folders in Google Drive
   * @param parentId Parent folder ID, or undefined for root
   * @param query Optional search query
   */
  async listFiles(parentId?: string, query?: string): Promise<DriveFile[]> {
    const token = await this.getAccessTokenInternal();

    // Build query
    let q = 'trashed = false';
    if (parentId) {
      q += ` and '${parentId}' in parents`;
    } else {
      q += " and 'root' in parents";
    }
    if (query) {
      q += ` and name contains '${query}'`;
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

  /**
   * Read file content from Google Drive
   * @param fileId The Google Drive file ID
   */
  async readFile(fileId: string): Promise<string> {
    const token = await this.getAccessTokenInternal();

    const url = `${driveApiConfig.apiBaseUrl}/files/${fileId}?alt=media`;

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
   * Create a new file in Google Drive
   * @param name File name
   * @param content File content
   * @param parentId Parent folder ID (optional)
   */
  async createFile(
    name: string,
    content: string | Uint8Array,
    parentId?: string
  ): Promise<DriveFile> {
    const token = await this.getAccessTokenInternal();

    const metadata = {
      name,
      mimeType: driveApiConfig.jsonMimeType,
      ...(parentId && { parents: [parentId] }),
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    // Create Blob from content
    if (typeof content === 'string') {
      form.append('file', new Blob([content], { type: driveApiConfig.jsonMimeType }));
    } else {
      // Convert Uint8Array buffer to ArrayBuffer for Blob
      const buffer = content.buffer.slice(
        content.byteOffset,
        content.byteOffset + content.byteLength
      ) as ArrayBuffer;
      form.append('file', new Blob([buffer], { type: driveApiConfig.jsonMimeType }));
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
   * @param fileId File ID to update
   * @param content New file content
   */
  async updateFile(fileId: string, content: string | Uint8Array): Promise<DriveFile> {
    const token = await this.getAccessTokenInternal();

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
   * Create user-friendly error messages from HTTP status codes
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
   * Revoke authentication and clear cached token
   */
  async revoke(): Promise<void> {
    if (this.cachedToken) {
      try {
        // Revoke token via Google API
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.cachedToken.accessToken}`, {
          method: 'POST',
        });
      } catch (error) {
        console.warn('Failed to revoke token:', error);
      }

      // Clear local cache
      this.cachedToken = null;
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}
