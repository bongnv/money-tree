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

/**
 * OneDrive Service
 * Manages MSAL authentication and Microsoft Graph API client
 * Singleton service shared across the application
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

export class OneDriveService {
  private msalInstance: PublicClientApplication | null = null;
  private graphClient: Client | null = null;
  private account: AccountInfo | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    if (isOneDriveConfigured()) {
      this.msalInstance = new PublicClientApplication(msalConfig);
      this.initPromise = this.initialize();
    }
  }

  /**
   * Initialize MSAL instance and check for cached account
   * This must be called before any other MSAL operations
   */
  private async initialize(): Promise<void> {
    if (!this.msalInstance) return;

    await this.msalInstance.initialize();

    // Check for cached account (no popup)
    const account = this.msalInstance.getActiveAccount() || this.msalInstance.getAllAccounts()[0];
    if (account) {
      this.account = account;
      this.msalInstance.setActiveAccount(account);
    }
  }

  /**
   * Check if authenticated (checks MSAL cache)
   * Async to ensure initialization is complete before checking
   */
  async isAuthenticated(): Promise<boolean> {
    await this.initPromise;
    return this.account !== null;
  }

  /**
   * Authenticate with Microsoft using popup flow
   * MUST be called during user interaction (button click) to avoid Safari popup blocker
   * Idempotent - safe to call multiple times
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
   * List folders and files in OneDrive
   * @param parentItem Parent folder item with metadata, or null/undefined for root
   */
  async listFolders(
    parentItem?: {
      id: string;
      remoteItem?: { id: string; parentReference?: { driveId: string } };
    } | null
  ): Promise<DriveItem[]> {
    const client = await this.getGraphClient();

    try {
      let items: any[] = [];

      if (!parentItem) {
        // Root level - get both personal drive and shared items
        const [personalItems, sharedItems] = await Promise.all([
          client.api('/me/drive/root/children').get(),
          client
            .api('/me/drive/sharedWithMe')
            .get()
            .catch(() => ({ value: [] })),
        ]);

        items = [...(personalItems.value || []), ...(sharedItems.value || [])];
      } else if (parentItem.remoteItem) {
        // Navigating into a shared folder
        const driveId = parentItem.remoteItem.parentReference?.driveId;
        const itemId = parentItem.remoteItem.id;

        if (!driveId || !itemId) {
          throw new Error('Invalid shared folder reference');
        }

        const endpoint = `/drives/${driveId}/items/${itemId}/children`;
        const response = await client.api(endpoint).get();
        items = response.value || [];
      } else {
        // Navigating into a personal folder
        const endpoint = `/me/drive/items/${parentItem.id}/children`;
        const response = await client.api(endpoint).get();
        items = response.value || [];
      }

      return items;
    } catch (error: any) {
      console.error('Failed to list folders:', error);
      throw this.createFriendlyError(error);
    }
  }

  /**
   * Read file from OneDrive using Graph API endpoint
   * @param endpoint The Graph API endpoint (e.g., '/me/drive/items/{id}/content')
   */
  async readFile(endpoint: string): Promise<any> {
    const client = await this.getGraphClient();
    return client.api(endpoint).get();
  }

  /**
   * Write file to OneDrive using Graph API endpoint
   * @param endpoint The Graph API endpoint (e.g., '/me/drive/items/{id}/content')
   * @param content The file content to write (string for JSON, Uint8Array for compressed/binary)
   */
  async writeFile(endpoint: string, content: string | Uint8Array): Promise<any> {
    const client = await this.getGraphClient();
    return client.api(endpoint).put(content);
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
   * Automatically handles token refresh
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
      // Try to acquire token silently (uses cached token or refresh token)
      const response = await this.msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Token refresh failed - use popup flow
        const response = await this.msalInstance.acquireTokenPopup(request);
        return response.accessToken;
      }
      throw error;
    }
  }

  /**
   * Create user-friendly error messages from Graph API errors
   */
  private createFriendlyError(error: any): Error {
    const statusCode = error?.statusCode;
    const code = error?.code;

    if (statusCode === 401 || code === 'InvalidAuthenticationToken') {
      return new Error('Authentication expired. Please reconnect to OneDrive.');
    }

    return new Error('Failed to load folder contents');
  }
}
