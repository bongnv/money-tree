/**
 * File Picker Service
 * Handles all file picker UI logic separately from storage provider operations
 */
export class FilePickerService {
  /**
   * Check if File System Access API is supported
   */
  static isFileSystemAccessSupported(): boolean {
    return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
  }

  /**
   * Show file picker for opening a local file
   * @returns Selected file handle or null if cancelled
   */
  static async showOpenFilePicker(): Promise<FileSystemFileHandle | null> {
    if (!this.isFileSystemAccessSupported()) {
      throw new Error(
        'File System Access API is not supported in this browser. Please use Chrome, Edge, or another compatible browser.'
      );
    }

    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Money Tree Data',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
        multiple: false,
      });
      return fileHandle;
    } catch (error) {
      // User cancelled the picker
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Show file picker for saving a local file
   * @param suggestedName - Suggested file name
   * @returns Selected file handle or null if cancelled
   */
  static async showSaveFilePicker(suggestedName: string): Promise<FileSystemFileHandle | null> {
    if (!this.isFileSystemAccessSupported()) {
      throw new Error(
        'File System Access API is not supported in this browser. Please use Chrome, Edge, or another compatible browser.'
      );
    }

    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'Money Tree Data',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      });
      return fileHandle;
    } catch (error) {
      // User cancelled the picker
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Show file picker for saving an archive file
   * @param suggestedName - Suggested file name
   * @returns Selected file handle or null if cancelled
   */
  static async showArchiveSaveFilePicker(
    suggestedName: string
  ): Promise<FileSystemFileHandle | null> {
    if (!this.isFileSystemAccessSupported()) {
      throw new Error(
        'File System Access API is not supported in this browser. Please use Chrome, Edge, or another compatible browser.'
      );
    }

    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'Money Tree Archive',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      });
      return fileHandle;
    } catch (error) {
      // User cancelled the picker
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Archive save cancelled by user');
      }
      throw error;
    }
  }

}
