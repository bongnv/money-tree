import { PublicClientApplication, AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import type { IStorageProvider } from './IStorageProvider';
import type { DataFile } from '../../types/models';
import { DataFileSchema } from '../../schemas/models.schema';
import { msalConfig, loginRequest, graphConfig, errorMessages, isOneDriveConfigured } from '../../config/onedrive.config';

/**
 * OneDrive Storage Provider
 * Uses Microsoft Graph API to store data in OneDrive
 */
export class OneDriveProvider implements IStorageProvider {
  private msalInstance: PublicClientApplication | null = null;
  private graphClient: Client | null = null;
  private account: AccountInfo | null = null;

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
   */
  async initialize(): Promise<void> {
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
   * Authenticate with Microsoft using popup flow
   */
  async authenticate(): Promise<void> {
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
  isAuthenticated(): boolean {
    return this.account !== null && this.graphClient !== null;
  }

  /**
   * Get authenticated user's email
   */
  getUserEmail(): string | null {
    return this.account?.username || null;
  }

  /**
   * Sign out and clear tokens
   */
  async signOut(): Promise<void> {
    const msalInstance = this.ensureMSALInstance();
    if (this.account) {
      await msalInstance.logoutPopup({ account: this.account });
      this.account = null;
      this.graphClient = null;
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
      // Try to acquire token silently
      const response = await msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Token expired or requires user interaction
        const response = await msalInstance.acquireTokenPopup(request);
        return response.accessToken;
      }
      throw error;
    }
  }

  /**
   * Load data file from OneDrive
   */
  async loadDataFile(): Promise<DataFile | null> {
    if (!this.isAuthenticated()) {
      throw new Error(errorMessages.authRequired);
    }

    try {
      // Download file content
      const response = await this.graphClient!
        .api(graphConfig.getFileContentUrl())
        .get();

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
        throw new Error(errorMessages.permissionDenied);
      }
      
      throw new Error(errorMessages.downloadFailed);
    }
  }

  /**
   * Save data file to OneDrive
   */
  async saveDataFile(data: DataFile): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error(errorMessages.authRequired);
    }

    // Validate data before saving
    DataFileSchema.parse(data);

    try {
      const content = JSON.stringify(data, null, 2);

      // Upload file content
      await this.graphClient!
        .api(graphConfig.getFileContentUrl())
        .put(content);
    } catch (error: any) {
      console.error('Failed to save file to OneDrive:', error);
      
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new Error(errorMessages.permissionDenied);
      }
      
      throw new Error(errorMessages.uploadFailed);
    }
  }

  /**
   * Check if has file handle (always true for OneDrive if authenticated)
   */
  hasFileHandle(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Clear cached authentication (sign out)
   */
  async clearFileHandle(): Promise<void> {
    await this.signOut();
  }

  /**
   * Get file name
   */
  getFileName(): string | null {
    return this.isAuthenticated() ? 'money-tree.json' : null;
  }

  /**
   * Ensure initialization is complete
   */
  async ensureInitialized(): Promise<void> {
    // OneDrive provider initialization happens in authenticate()
    // This method exists for interface compatibility
  }
}
