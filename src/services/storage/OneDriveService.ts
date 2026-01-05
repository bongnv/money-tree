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
    // Start initialization immediately
    this.initPromise = this.initializeMSAL();
  }

  /**
   * Authenticate with Microsoft using popup flow
   * Idempotent - skips if already authenticated
   */
  async authenticate(): Promise<void> {
    await this.ensureInitialized();

    // Skip if already authenticated
    if (this.isAuthenticated()) {
      return;
    }

    const msalInstance = this.ensureMSALInstance();
    try {
      const response = await msalInstance.loginPopup(loginRequest);
      this.account = response.account;
      await this.initializeGraphClient();
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error(errorMessages.authFailed);
    }
  }

  /**
   * Check if user is authenticated
   */
  private isAuthenticated(): boolean {
    return this.account !== null && this.graphClient !== null;
  }

  /**
   * Disconnect from OneDrive (clear app access without global sign out)
   */
  disconnect(): void {
    // Clear app authentication state without signing out of Microsoft globally
    this.account = null;
    this.graphClient = null;
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
    await this.ensureInitialized();

    try {
      let items: any[] = [];

      if (!parentItem) {
        // Root level - get both personal drive and shared items
        const [personalItems, sharedItems] = await Promise.all([
          this.graphClient!.api('/me/drive/root/children').get(),
          this.graphClient!.api('/me/drive/sharedWithMe')
            .get()
            .catch(() => ({ value: [] })),
        ]);

        items = [...(personalItems.value || []), ...(sharedItems.value || [])];
      } else if (parentItem.remoteItem) {
        // Navigating into a shared folder - use the remote drive and item IDs
        const driveId = parentItem.remoteItem.parentReference?.driveId;
        const itemId = parentItem.remoteItem.id;

        if (!driveId || !itemId) {
          throw new Error('Invalid shared folder reference');
        }

        const endpoint = `/drives/${driveId}/items/${itemId}/children`;
        const response = await this.graphClient!.api(endpoint).get();
        items = response.value || [];
      } else {
        // Navigating into a personal folder
        const endpoint = `/me/drive/items/${parentItem.id}/children`;
        const response = await this.graphClient!.api(endpoint).get();
        items = response.value || [];
      }

      return items;
    } catch (error: any) {
      console.error('Failed to list folders:', error);
      throw new Error('Failed to load folder contents');
    }
  }

  /**
   * Read file from OneDrive using Graph API endpoint
   * @param endpoint The Graph API endpoint (e.g., '/me/drive/items/{id}/content')
   */
  async readFile(endpoint: string): Promise<any> {
    await this.ensureInitialized();

    return this.graphClient!.api(endpoint).get();
  }

  /**
   * Write file to OneDrive using Graph API endpoint
   * @param endpoint The Graph API endpoint (e.g., '/me/drive/items/{id}/content')
   * @param content The file content to write
   */
  async writeFile(endpoint: string, content: string): Promise<any> {
    await this.ensureInitialized();

    return this.graphClient!.api(endpoint).put(content);
  }

  /**
   * Lazy load MSAL instance to avoid initialization errors in test environments
   */
  private ensureMSALInstance(): PublicClientApplication {
    if (!isOneDriveConfigured()) {
      throw new Error(errorMessages.configError);
    }
    if (!this.msalInstance) {
      this.msalInstance = new PublicClientApplication(msalConfig);
    }
    return this.msalInstance;
  }

  /**
   * Initialize MSAL and check for existing authentication
   * Called automatically in constructor
   */
  private async initializeMSAL(): Promise<void> {
    if (!isOneDriveConfigured()) {
      // Silently skip initialization if not configured
      return;
    }
    const msalInstance = this.ensureMSALInstance();
    await msalInstance.initialize();

    // Check if user is already logged in
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      this.account = accounts[0];
      await this.initializeGraphClient();
    }
  }

  /**
   * Ensure initialization is complete before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Initialize Microsoft Graph client with authentication
   */
  private async initializeGraphClient(): Promise<void> {
    if (!this.account) {
      throw new Error(errorMessages.authRequired);
    }

    // Create Graph client with authentication
    this.graphClient = Client.init({
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
   * Automatically handles token refresh and shows popup if needed
   */
  private async getAccessToken(): Promise<string> {
    const msalInstance = this.ensureMSALInstance();
    if (!this.account) {
      throw new Error(errorMessages.authRequired);
    }

    const request = {
      ...loginRequest,
      account: this.account,
    };

    try {
      // Try to acquire token silently (uses cached token or refresh token)
      const response = await msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Token refresh failed - try popup for re-authentication
        try {
          const response = await msalInstance.acquireTokenPopup(request);
          return response.accessToken;
        } catch (popupError) {
          // Popup blocked or failed - throw auth error
          console.warn('Token refresh popup failed:', popupError);
          throw new Error('Authentication expired. Please reconnect via Settings.');
        }
      }
      throw error;
    }
  }
}
