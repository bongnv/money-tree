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
    // Eagerly start initialization
    this.initialize();
  }

  /**
   * Initialize MSAL instance
   * This must be called before any other MSAL operations
   */
  private async initialize(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Skip if not configured
    if (!isOneDriveConfigured()) {
      this.initPromise = Promise.resolve();
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        // Create and initialize MSAL
        this.msalInstance = new PublicClientApplication(msalConfig);
        await this.msalInstance.initialize();

        // Check for existing session
        await this.checkExistingSession();
      } catch (error) {
        console.error('Failed to initialize OneDrive service:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Check for existing authenticated session
   */
  private async checkExistingSession(): Promise<void> {
    if (!this.msalInstance || this.account) return;

    // Try to get active account first (more reliable in Safari)
    let account = this.msalInstance.getActiveAccount();

    // Fallback to getAllAccounts if no active account
    if (!account) {
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        account = accounts[0];
        this.msalInstance.setActiveAccount(account);
      }
    }
    if (account) {
      this.account = account;
      await this.createGraphClient();
    }
  }

  /**
   * Authenticate with Microsoft using popup flow
   * Idempotent - skips if already authenticated
   */
  async authenticate(): Promise<void> {
    await this.ensureInitialized();

    // Skip if already authenticated
    if (this.account !== null) {
      return;
    }

    if (!this.msalInstance) {
      throw new Error(errorMessages.configError);
    }

    try {
      const response = await this.msalInstance.loginPopup(loginRequest);
      this.account = response.account;
      this.msalInstance.setActiveAccount(response.account);
      await this.createGraphClient();
    } catch (error: any) {
      console.error('Authentication failed:', error);

      // Check for popup blocking
      if (error.errorCode === 'popup_window_error') {
        throw new Error(
          'Please allow popups for this site to connect to OneDrive. Check your browser settings and try again.'
        );
      }

      throw new Error(errorMessages.authFailed);
    }
  }

  /**
   * Disconnect from OneDrive (clear app access without global sign out)
   */
  disconnect(): void {
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
    this.ensureGraphClient();

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
        // Navigating into a shared folder
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
      throw this.createFriendlyError(error);
    }
  }

  /**
   * Read file from OneDrive using Graph API endpoint
   * @param endpoint The Graph API endpoint (e.g., '/me/drive/items/{id}/content')
   */
  async readFile(endpoint: string): Promise<any> {
    await this.ensureInitialized();
    this.ensureGraphClient();

    return this.graphClient!.api(endpoint).get();
  }

  /**
   * Write file to OneDrive using Graph API endpoint
   * @param endpoint The Graph API endpoint (e.g., '/me/drive/items/{id}/content')
   * @param content The file content to write
   */
  async writeFile(endpoint: string, content: string): Promise<any> {
    await this.ensureInitialized();
    this.ensureGraphClient();

    return this.graphClient!.api(endpoint).put(content);
  }

  /**
   * Ensure initialization is complete
   * @throws Error if initialization failed
   */
  private async ensureInitialized(): Promise<void> {
    await this.initPromise;
  }

  /**
   * Ensure graph client exists
   * @throws Error if not authenticated
   */
  private ensureGraphClient(): void {
    if (!this.graphClient) {
      throw new Error(errorMessages.authRequired);
    }
  }

  /**
   * Create Microsoft Graph client with authentication
   */
  private async createGraphClient(): Promise<void> {
    if (!this.account) {
      throw new Error(errorMessages.authRequired);
    }

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
