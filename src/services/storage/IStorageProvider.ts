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
   * Authenticate with the storage provider
   * For local: no-op (File System Access API handles permissions per-file)
   * For cloud: trigger OAuth flow
   */
  authenticate(): Promise<void>;

  /**
   * Read file content
   * @param fileItem CloudItem representing the file to read (must have id)
   * @returns File content as string
   */
  readMainFile(fileItem: CloudItem): Promise<string>;

  /**
   * Write to file - creates new file or updates existing
   * @param fileItem CloudItem representing the file (id='' for new file)
   * @param content String content to write
   * @returns Updated CloudItem with fileId populated for new files
   */
  writeMainFile(fileItem: CloudItem, content: string): Promise<CloudItem>;

  /**
   * Save an additional file (backup, archive, etc.)
   * For local: shows file picker
   * For cloud: saves in same folder as main file
   * @param mainFileItem CloudItem of main file (for determining save location)
   * @param filename The filename for the new file
   * @param content String or Blob to write
   */
  saveAdditionalFile(
    mainFileItem: CloudItem,
    filename: string,
    content: string | Blob
  ): Promise<void>;

  /**
   * Get provider name for display
   */
  getName(): string;

  /**
   * List items (files and folders) in a given folder
   * Used by file picker UI
   * @param parent Parent folder (undefined for root)
   * @returns Array of CloudItems with provider-specific metadata
   */
  listItems(parent?: CloudItem): Promise<CloudItem[]>;
}
