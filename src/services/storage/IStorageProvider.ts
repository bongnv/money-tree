/**
 * Storage provider type enum
 */
export enum StorageProviderType {
  ONEDRIVE = 'onedrive',
  // GOOGLEDRIVE = 'googledrive', // Future
}

// Generic cloud item for file picker
export interface CloudItem {
  id: string;
  name: string;
  isFolder: boolean;
  isSharedWithMe?: boolean; // Whether this item is shared with me by someone else
  // Provider-specific metadata (optional)
  parentItemId?: string; // Parent folder ID (OneDrive)
  driveId?: string; // Drive ID for shared folders (OneDrive)
}

/**
 * Storage Provider Interface - Stateless
 * Providers should not store file state internally.
 * CloudItem is the universal file descriptor.
 * State management is handled by SyncContext.
 */
export interface IStorageProvider {
  /**
   * Initialize provider - verify authentication only
   * Called once at app startup
   * @returns true if authenticated
   */
  initialize(): Promise<boolean>;

  /**
   * Check if provider is authenticated
   * @returns true if authenticated and ready to use
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * Authenticate with the storage provider
   * For local: no-op (File System Access API handles permissions per-file)
   * For cloud: trigger OAuth flow
   */
  authenticate(): Promise<void>;

  /**
   * Read file content
   * @param fileItem CloudItem representing the file to read (must have id)
   * @returns File content as Blob
   */
  readFile(fileItem: CloudItem): Promise<Blob>;

  /**
   * Write to file - creates new file or updates existing
   * @param fileItem CloudItem representing the file (id='' for new file)
   * @param content Blob content to write
   * @returns Updated CloudItem with fileId populated for new files
   */
  writeFile(fileItem: CloudItem, content: Blob): Promise<CloudItem>;

  /**
   * Get provider type identifier
   */
  getType(): StorageProviderType;

  /**
   * List items (files and folders) in a given folder
   * Used by file picker UI
   * @param parent Parent folder (undefined for root)
   * @returns Array of CloudItems with provider-specific metadata
   */
  listItems(parent?: CloudItem): Promise<CloudItem[]>;
}
