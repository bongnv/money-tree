/**
 * Google Drive Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable "Google Drive API" for your project
 * 4. Go to "Credentials" section
 * 5. Create OAuth 2.0 Client ID:
 *    - Click "Create Credentials" -> "OAuth client ID"
 *    - Application type: "Web application"
 *    - Name: "Money Tree App"
 *    - Authorized JavaScript origins: Add http://localhost:3000, http://localhost:8080 and your production domain
 *    - Authorized redirect URIs: Same as origins
 *    - Copy the "Client ID"
 *
 * BUILD CONFIGURATION:
 * Set environment variables when building:
 *   Development:
 *     GOOGLE_DRIVE_CLIENT_ID=your-client-id \
 *     npm run dev
 *   Production:
 *     GOOGLE_DRIVE_CLIENT_ID=your-client-id \
 *     npm run build
 *
 * Or create a .env file (not committed to git):
 *   GOOGLE_DRIVE_CLIENT_ID=your-client-id
 */

export const googleDriveConfig = {
  // Client ID must be injected via GOOGLE_DRIVE_CLIENT_ID environment variable at build time
  clientId: process.env.GOOGLE_DRIVE_CLIENT_ID || '',

  // OAuth 2.0 scopes for Google Drive API
  // drive.file: Access only files created by the app or explicitly opened by the user
  // This minimal scope follows the principle of least privilege and is non-sensitive
  scopes: ['https://www.googleapis.com/auth/drive.file'],

  // Discovery docs for Google Drive API
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],

  // Redirect URI - must match what's configured in Google Cloud Console
  redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
};

/**
 * Google Drive API configuration
 */
export const driveApiConfig = {
  // Google Drive API base URL
  apiBaseUrl: 'https://www.googleapis.com/drive/v3',

  // Upload endpoint for multipart upload
  uploadUrl: 'https://www.googleapis.com/upload/drive/v3/files',

  // MIME type for JSON files
  jsonMimeType: 'application/json',

  // MIME type for folders
  folderMimeType: 'application/vnd.google-apps.folder',
};

/**
 * Error messages
 */
export const errorMessages = {
  authRequired: 'Please authenticate with Google to access Google Drive',
  authFailed: 'Failed to authenticate with Google',
  uploadFailed: 'Failed to upload file to Google Drive',
  downloadFailed: 'Failed to download file from Google Drive',
  networkError: 'Network error. Please check your connection and try again',
  permissionDenied: 'Permission denied. Please grant access to Google Drive',
  configError:
    'Google Drive is not properly configured. Please check the Google Cloud Console setup.',
};

/**
 * Check if Google Drive is configured
 */
export const isGoogleDriveConfigured = (): boolean => {
  return googleDriveConfig.clientId !== '';
};
