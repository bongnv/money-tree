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
   * @param suggestedName - Suggested file name (extension determines file type)
   * @param description - Optional file type description (defaults to derived from extension)
   * @returns Selected file handle or null if cancelled
   */
  static async showSaveFilePicker(
    suggestedName: string,
    description?: string
  ): Promise<FileSystemFileHandle | null> {
    if (!this.isFileSystemAccessSupported()) {
      throw new Error(
        'File System Access API is not supported in this browser. Please use Chrome, Edge, or another compatible browser.'
      );
    }

    // Derive file type from extension
    const extension = suggestedName.substring(suggestedName.lastIndexOf('.'));
    let mimeType: string;
    let defaultDescription: string;

    switch (extension) {
      case '.gz':
        mimeType = 'application/gzip';
        defaultDescription = 'GZIP Archive';
        break;
      case '.zip':
        mimeType = 'application/zip';
        defaultDescription = 'ZIP Archive';
        break;
      case '.json':
      default:
        mimeType = 'application/json';
        defaultDescription = 'JSON File';
        break;
    }

    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: description || defaultDescription,
            accept: {
              [mimeType]: [extension],
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
}
