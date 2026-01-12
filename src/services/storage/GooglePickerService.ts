import { googleDriveConfig } from '../../config/googledrive.config';

export interface PickerFileInfo {
  id: string;
  name: string;
  mimeType: string;
  parentId?: string;
}

/**
 * Google Picker Service
 * Handles Google Picker API integration for file selection
 */
export class GooglePickerService {
  private static pickerApiLoaded = false;
  private static pickerApiLoadPromise: Promise<void> | null = null;

  /**
   * Load Google Picker API
   */
  private static async loadPickerApi(): Promise<void> {
    if (this.pickerApiLoaded) {
      return;
    }

    if (this.pickerApiLoadPromise) {
      return this.pickerApiLoadPromise;
    }

    this.pickerApiLoadPromise = new Promise((resolve, reject) => {
      // Check if gapi script is already loaded
      if (typeof window.gapi !== 'undefined') {
        window.gapi.load('picker', {
          callback: () => {
            this.pickerApiLoaded = true;
            resolve();
          },
          onerror: () => {
            reject(new Error('Failed to load Google Picker API'));
          },
        });
        return;
      }

      // Load gapi script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        window.gapi.load('picker', {
          callback: () => {
            this.pickerApiLoaded = true;
            resolve();
          },
          onerror: () => {
            reject(new Error('Failed to load Google Picker API'));
          },
        });
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google API library'));
      };

      document.head.appendChild(script);
    });

    return this.pickerApiLoadPromise;
  }

  /**
   * Show Google Picker to select or create a file
   * @param accessToken OAuth 2.0 access token
   * @param allowCreate Whether to show "Create" option
   * @returns Selected file info or null if cancelled
   */
  static async showPicker(
    accessToken: string,
    allowCreate: boolean = true
  ): Promise<PickerFileInfo | null> {
    await this.loadPickerApi();

    return new Promise((resolve) => {
      const pickerCallback = (data: google.picker.ResponseObject) => {
        if (data.action === google.picker.Action.PICKED) {
          const doc = data.docs?.[0];
          if (doc) {
            resolve({
              id: doc.id,
              name: doc.name,
              mimeType: doc.mimeType,
              parentId: doc.parentId,
            });
            return;
          }
        } else if (data.action === google.picker.Action.CANCEL) {
          // User explicitly cancelled
          resolve(null);
          return;
        }

        // Ignore other actions like 'loaded'
      };

      // Create DocsView that shows folders and JSON files
      const docsView = new google.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)
        .setMimeTypes('application/json,application/vnd.google-apps.folder');

      const pickerBuilder = new google.picker.PickerBuilder()
        .addView(docsView)
        .addView(google.picker.ViewId.FOLDERS)
        .setOAuthToken(accessToken)
        .setDeveloperKey(googleDriveConfig.apiKey)
        .setCallback(pickerCallback)
        .setTitle('Select Money Tree file location');

      // Enable multiselect if creating (so user can pick folder)
      if (allowCreate) {
        pickerBuilder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
      }

      const picker = pickerBuilder.build();
      picker.setVisible(true);
    });
  }
}
