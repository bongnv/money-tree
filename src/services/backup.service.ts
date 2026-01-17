import { strToU8, gzipSync } from 'fflate';
import { useAppStore } from '../stores/useAppStore';
import { StorageService } from './storage/StorageService';

/**
 * Backup Service
 * Handles data backup operations including compression and storage
 */
export class BackupService {
  private readonly BACKUP_THRESHOLD_DAYS = 30;
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * Check if backup is needed based on last backup date
   * Returns true if backup older than threshold (30 days) or never backed up with saved data
   */
  shouldPromptBackup(): boolean {
    const state = useAppStore.getState();
    const lastBackupDate = state.lastBackupDate;

    if (!lastBackupDate) {
      // Never backed up - only prompt if there's saved data to back up
      return !!state.baseVersion;
    }

    const lastBackup = new Date(lastBackupDate);
    const now = new Date();
    const daysSinceBackup = Math.floor(
      (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceBackup >= this.BACKUP_THRESHOLD_DAYS;
  }

  /**
   * Save backup file using storage provider (local or OneDrive)
   * - Backs up the baseVersion (last saved state) from appStore
   * - Creates compressed ZIP backup of data file
   * - Generates filename with timestamp
   * - Uses file picker to let user choose backup location
   * - Updates lastBackupDate in appStore after successful save
   * - Sets unsavedChanges flag to trigger save of updated metadata
   */
  async saveBackupToStorage(): Promise<void> {
    const state = useAppStore.getState();
    const baseVersion = state.baseVersion;

    if (!baseVersion) {
      throw new Error('Cannot create backup: No saved data found. Please save your data first.');
    }

    // Create gzip compressed file with fflate
    const dataJson = JSON.stringify(baseVersion);
    const uint8Array = strToU8(dataJson);

    // Compress with maximum compression level (9)
    const compressed = gzipSync(uint8Array, { level: 9 });

    // Convert to Blob for browser compatibility
    const blob = new Blob([compressed as BlobPart], { type: 'application/gzip' });

    // Generate filename with timestamp
    const filename = this.generateBackupFilename();

    try {
      // Save using storage provider (file picker for local, next to main file for OneDrive)
      await this.storageService.saveFile(blob, filename);

      // Update lastBackupDate in appStore
      const now = new Date().toISOString();
      state.setLastBackupDate(now);
      state.setUnsavedChanges(true); // Trigger save indicator
    } catch (error) {
      // Re-throw if user cancellation
      if (error instanceof Error && error.message === 'File save cancelled') {
        throw error;
      }
      console.warn('Backup save failed:', error);
      throw new Error(
        `Failed to save backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate backup filename with timestamp
   * Format: money-tree-backup-YYYY-MM-DD-HHmmss.zip
   */
  private generateBackupFilename(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `money-tree-backup-${year}-${month}-${day}-${hours}${minutes}${seconds}.gz`;
  }
}
