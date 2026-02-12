import { isOneDriveConfigured } from '@/config/onedrive.config';
import { IStorageProvider, CloudItem, StorageProviderType } from './storage/IStorageProvider';
import { OneDriveProvider } from './storage/OneDriveProvider';

const STORAGE_CONFIG_KEY = 'moneyTree.storageProviderConfig';

/**
 * CloudService - Manages cloud storage provider lifecycle
 * Hides provider implementation details from the application
 */
export class CloudService {
  private currentProvider: IStorageProvider | null = null;

  /**
   * Initialize on app startup
   * Loads cached provider from localStorage and initializes it
   */
  async initialize(): Promise<void> {
    const savedType = this.loadProviderConfig();
    if (!savedType) {
      // No cached provider - new user
      return;
    }

    const provider = this.createProvider(savedType);
    if (!provider) {
      // Provider not configured - clear invalid cache
      this.clearProviderConfig();
      return;
    }

    // Initialize provider (check auth without triggering new auth flow)
    await provider.initialize();

    // Store provider (even if not authenticated - SyncContext will check)
    this.currentProvider = provider;
  }

  /**
   * Connect to a storage provider
   * Triggers authentication flow if needed
   */
  async connect(providerType: StorageProviderType): Promise<void> {
    const provider = this.createProvider(providerType);
    if (!provider) {
      throw new Error(`Provider not available: ${providerType}`);
    }

    // Save config before authentication (handles redirect case)
    this.saveProviderConfig(providerType);

    // Authenticate (may redirect or return if already authenticated)
    await provider.authenticate();

    // Store provider
    this.currentProvider = provider;
  }

  /**
   * Disconnect from current provider
   * Clears provider and cached config
   */
  async disconnect(): Promise<void> {
    this.currentProvider = null;
    this.clearProviderConfig();
  }

  /**
   * Re-authenticate with current provider
   * Used when auth expires (Safari sessionStorage clearing)
   */
  async reconnect(): Promise<void> {
    this.ensureProvider();

    // Re-authenticate with current provider
    await this.currentProvider!.authenticate();
  }

  /**
   * List files in a folder
   */
  async listFiles(parent?: CloudItem): Promise<CloudItem[]> {
    this.ensureProvider();
    return this.currentProvider!.listItems(parent);
  }

  /**
   * Read file content
   */
  async readFile(fileItem: CloudItem): Promise<Blob> {
    this.ensureProvider();
    return this.currentProvider!.readFile(fileItem);
  }

  /**
   * Write file content
   */
  async writeFile(fileItem: CloudItem, content: Blob): Promise<CloudItem> {
    this.ensureProvider();
    return this.currentProvider!.writeFile(fileItem, content);
  }

  /**
   * Get current provider type
   */
  getCurrentProvider(): StorageProviderType | null {
    if (!this.currentProvider) {
      return null;
    }
    return this.currentProvider.getType();
  }

  /**
   * Get current provider display name
   */
  getProviderName(): string | null {
    const type = this.getCurrentProvider();
    if (!type) {
      return null;
    }
    switch (type) {
      case StorageProviderType.ONEDRIVE:
        return 'OneDrive';
      default:
        return 'Cloud';
    }
  }

  /**
   * Check if current provider is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.currentProvider) {
      return false;
    }
    return this.currentProvider.isAuthenticated();
  }

  // ==================== PRIVATE HELPERS ====================

  private createProvider(type: StorageProviderType): IStorageProvider | null {
    switch (type) {
      case StorageProviderType.ONEDRIVE:
        return isOneDriveConfigured() ? new OneDriveProvider() : null;
      default:
        return null;
    }
  }

  private loadProviderConfig(): StorageProviderType | null {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    return saved as StorageProviderType | null;
  }

  private saveProviderConfig(type: StorageProviderType): void {
    localStorage.setItem(STORAGE_CONFIG_KEY, type);
  }

  private clearProviderConfig(): void {
    localStorage.removeItem(STORAGE_CONFIG_KEY);
  }

  private ensureProvider(): void {
    if (!this.currentProvider) {
      throw new Error('No active cloud provider');
    }
  }
}
