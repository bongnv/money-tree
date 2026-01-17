/**
 * Storage Provider Interface
 * Each provider manages its own file state internally and handles caching
 */
export interface IStorageProvider {
  /**
   * Initialize provider - load cached file and verify authentication
   * Called once at app startup
   * @returns true if successfully loaded cached file with valid authentication
   */
  initialize(): Promise<boolean>;

  /**
   * Authenticate with the storage provider
   * For local: no-op (File System Access API handles permissions per-file)
   * For cloud: trigger OAuth flow
   */
  authenticate(): Promise<void>;

  /**
   * Read main file content
   * @throws Error if no file is set
   */
  readMainFile(): Promise<string>;

  /**
   * Write to main file
   * @param content String content to write
   * @throws Error if no file is set
   */
  writeMainFile(content: string): Promise<void>;

  /**
   * Save an additional file (backup, archive, etc.)
   * For local: shows file picker
   * For cloud: saves in same folder as main file
   * @param filename The filename for the new file
   * @param content String or Blob to write
   */
  saveAdditionalFile(filename: string, content: string | Blob): Promise<void>;

  /**
   * Get main file name
   * @returns File name or null if no file set
   */
  getMainFileName(): string | null;

  /**
   * Get provider name for display
   */
  getName(): string;

  /**
   * Clear cached file
   */
  clearCache(): Promise<void>;
}
