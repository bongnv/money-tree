import {
  PublicClientApplication,
  AccountInfo,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import type { IStorageProvider } from './IStorageProvider';
import type { DataFile, ArchiveFile } from '../../types/models';
import { DataFileSchema } from '../../schemas/models.schema';
import {
  msalConfig,
  loginRequest,
  graphConfig,
  errorMessages,
  isOneDriveConfigured,
} from '../../config/onedrive.config';

/**
 * OneDrive Storage Provider
 * Uses Microsoft Graph API to store data in OneDrive
 */
export interface SelectedFileInfo {
  fileId: string;
  filePath: string;
  fileName: string;
  isNew: boolean;
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

const SELECTED_FILE_KEY = 'moneyTree.onedrive.selectedFile';

export class OneDriveProvider implements IStorageProvider {
  private msalInstance: PublicClientApplication | null = null;
  private graphClient: Client | null = null;
  private account: AccountInfo | null = null;
  private selectedFileInfo: SelectedFileInfo | null = null;
  private filePickerResolver: ((fileInfo: SelectedFileInfo) => void) | null = null;
  private filePickerRejecter: ((error: Error) => void) | null = null;

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

    // Load selected file info from localStorage
    this.loadSelectedFileInfo();

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
   * Check if provider is ready to load/save data
   * @returns True if authenticated, false otherwise
   */
  isReady(): boolean {
    return this.isAuthenticated();
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
      this.selectedFileInfo = null;
      localStorage.removeItem(SELECTED_FILE_KEY);
    }
  }

  /**
   * Disconnect from OneDrive (clear app access without global sign out)
   */
  disconnect(): void {
    // Clear app authentication state without signing out of Microsoft globally
    this.account = null;
    this.graphClient = null;
    this.selectedFileInfo = null;
    localStorage.removeItem(SELECTED_FILE_KEY);
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
   * Set selected file location
   */
  setSelectedFile(fileInfo: SelectedFileInfo): void {
    this.selectedFileInfo = fileInfo;
    localStorage.setItem(SELECTED_FILE_KEY, JSON.stringify(fileInfo));
  }

  /**
   * Get selected file location
   */
  getSelectedFile(): SelectedFileInfo | null {
    return this.selectedFileInfo;
  }

  /**
   * Load selected file info from localStorage
   */
  private loadSelectedFileInfo(): void {
    const stored = localStorage.getItem(SELECTED_FILE_KEY);
    if (stored) {
      try {
        this.selectedFileInfo = JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to parse stored file info:', error);
        this.selectedFileInfo = null;
      }
    }
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
  ): Promise<any[]> {
    if (!this.isAuthenticated()) {
      throw new Error(errorMessages.authRequired);
    }

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
   * Search for files in OneDrive
   * @param query Search query
   */
  async searchFiles(query: string): Promise<any[]> {
    if (!this.isAuthenticated()) {
      throw new Error(errorMessages.authRequired);
    }

    try {
      const response = await this.graphClient!.api(
        `/me/drive/root/search(q='${encodeURIComponent(query)}')`
      ).get();
      return response.value || [];
    } catch (error: any) {
      console.error('Failed to search files:', error);
      throw new Error('Failed to search files');
    }
  }

  /**
   * Get file content URL based on selected file or default path
   */
  private getFileUrl(): string {
    if (this.selectedFileInfo && this.selectedFileInfo.fileId !== 'new') {
      // Use specific file ID
      return `/me/drive/items/${this.selectedFileInfo.fileId}/content`;
    }
    // Use default path
    return graphConfig.getFileContentUrl();
  }

  /**
   * Get file upload URL based on selected file or default path
   */
  private getUploadUrl(): string {
    if (this.selectedFileInfo) {
      if (this.selectedFileInfo.isNew || this.selectedFileInfo.fileId === 'new') {
        // Create new file at specified path
        return `/me/drive/root:/${this.selectedFileInfo.filePath}:/content`;
      } else {
        // Update existing file by ID
        return `/me/drive/items/${this.selectedFileInfo.fileId}/content`;
      }
    }
    // Use default path
    return graphConfig.getFileContentUrl();
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
      throw new Error(
        'Please authenticate with OneDrive. Go to Settings → Data & Sync to reconnect your account.'
      );
    }

    try {
      // Download file content
      const response = await this.graphClient!.api(this.getFileUrl()).get();

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
        throw new Error(
          'OneDrive permission expired. Please reconnect your account in Settings → Data & Sync.'
        );
      }

      throw new Error(errorMessages.downloadFailed);
    }
  }

  /**
   * Save data file to OneDrive
   */
  async saveDataFile(data: DataFile): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error(
        'Please authenticate with OneDrive. Go to Settings → Data & Sync to reconnect your account.'
      );
    }

    // Validate data before saving
    DataFileSchema.parse(data);

    try {
      const content = JSON.stringify(data, null, 2);

      // Upload file content
      const response = await this.graphClient!.api(this.getUploadUrl()).put(content);

      // If this was a new file, update the file ID
      if (this.selectedFileInfo && this.selectedFileInfo.isNew) {
        this.selectedFileInfo.fileId = response.id;
        this.selectedFileInfo.isNew = false;
        localStorage.setItem(SELECTED_FILE_KEY, JSON.stringify(this.selectedFileInfo));
      }
    } catch (error: any) {
      console.error('Failed to save file to OneDrive:', error);

      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new Error(
          'OneDrive permission expired. Please reconnect your account in Settings → Data & Sync.'
        );
      }

      throw new Error(errorMessages.uploadFailed);
    }
  }

  /**
   * Clear cached file reference (for switching files)
   * Does not sign out - user stays authenticated
   */
  async clearFileHandle(): Promise<void> {
    this.selectedFileInfo = null;
    localStorage.removeItem(SELECTED_FILE_KEY);
  }

  /**
   * Get file name
   */
  getFileName(): string | null {
    if (!this.isAuthenticated()) return null;
    return this.selectedFileInfo?.fileName || 'money-tree.json';
  }

  /**
   * Ensure initialization is complete
   */
  async ensureInitialized(): Promise<void> {
    // OneDrive provider initialization happens in authenticate()
    // This method exists for interface compatibility
  }

  /**
   * Save archive file to OneDrive
   * Always shows file picker to let user choose location
   */
  async saveArchiveFile(archiveFile: ArchiveFile): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with OneDrive');
    }

    const fileName = `money-tree-${archiveFile.year}.json`;
    const content = JSON.stringify(archiveFile, null, 2);

    // Show picker and wait for user selection
    const fileInfo = await this.showFilePicker(fileName);

    // Upload to OneDrive
    const uploadPath = fileInfo.filePath.startsWith('/')
      ? `/me/drive/root:${fileInfo.filePath}:/content`
      : `/me/drive/root:/${fileInfo.filePath}:/content`;

    await this.graphClient!.api(uploadPath).put(content);

    return fileName;
  }

  /**
   * Show file picker and return selected file info
   * @param defaultFileName - Default file name to suggest
   */
  private async showFilePicker(defaultFileName: string): Promise<SelectedFileInfo> {
    return new Promise<SelectedFileInfo>((resolve, reject) => {
      this.filePickerResolver = resolve;
      this.filePickerRejecter = reject;

      // Dispatch event to show picker in UI
      window.dispatchEvent(
        new CustomEvent('onedrive-file-picker-open', {
          detail: { defaultFileName },
        })
      );
    });
  }

  /**
   * Resolve file picker with selected file info
   * Called by UI when user selects a file
   */
  public resolveFilePicker(fileInfo: SelectedFileInfo): void {
    if (this.filePickerResolver) {
      this.filePickerResolver(fileInfo);
      this.filePickerResolver = null;
      this.filePickerRejecter = null;
    }
  }

  /**
   * Reject file picker (user cancelled)
   * Called by UI when user cancels picker
   */
  public rejectFilePicker(): void {
    if (this.filePickerRejecter) {
      this.filePickerRejecter(new Error('File picker cancelled by user'));
      this.filePickerResolver = null;
      this.filePickerRejecter = null;
    }
  }
}
