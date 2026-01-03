/**
 * OneDrive/Microsoft Graph API Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
 * 2. Click "New registration"
 * 3. Name: "Money Tree App"
 * 4. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
 * 5. Redirect URI: Select "Single-page application (SPA)" platform, add http://localhost:8080
 * 6. After registration, copy the "Application (client) ID"
 * 7. Under "API permissions", add "Microsoft Graph" -> "Delegated permissions" -> "Files.ReadWrite"
 * 8. Grant admin consent for the permissions
 * 
 * BUILD CONFIGURATION:
 * Set ONEDRIVE_CLIENT_ID environment variable when building:
 *   Development: ONEDRIVE_CLIENT_ID=your-client-id npm run dev
 *   Production:  ONEDRIVE_CLIENT_ID=your-client-id npm run build
 */

export const msalConfig = {
  auth: {
    // Client ID must be injected via ONEDRIVE_CLIENT_ID environment variable at build time
    // Example: ONEDRIVE_CLIENT_ID=your-client-id npm run build
    clientId: process.env.ONEDRIVE_CLIENT_ID || '',

    // Authority for Microsoft personal accounts only
    // Use 'consumers' for personal accounts, 'common' for both personal and organizational
    authority: 'https://login.microsoftonline.com/consumers',

    // Redirect URI - must match what's configured in Azure portal
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'localStorage', // Store tokens in localStorage (more persistent than sessionStorage)
    storeAuthStateInCookie: false, // Set to true if you have issues with IE11 or Edge
  },
};

/**
 * Scopes required for Microsoft Graph API
 * Files.ReadWrite: Read and write files in OneDrive
 */
export const loginRequest = {
  scopes: ['Files.ReadWrite'],
};

/**
 * Microsoft Graph API configuration
 */
export const graphConfig = {
  // Graph API endpoint
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',

  // OneDrive file path - file will be stored in OneDrive root folder
  dataFilePath: '/money-tree.json',

  // Full URL for file operations
  getFileUrl: (fileName: string = 'money-tree.json') =>
    `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}`,

  // URL for file content operations
  getFileContentUrl: (fileName: string = 'money-tree.json') =>
    `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/content`,
};

/**
 * Error messages
 */
export const errorMessages = {
  authRequired: 'Please authenticate with Microsoft to access OneDrive',
  authFailed: 'Failed to authenticate with Microsoft',
  uploadFailed: 'Failed to upload file to OneDrive',
  downloadFailed: 'Failed to download file from OneDrive',
  networkError: 'Network error. Please check your connection and try again',
  permissionDenied: 'Permission denied. Please grant access to OneDrive',
  configError: 'OneDrive is not properly configured. Please check the Azure app registration.',
};

/**
 * Check if OneDrive is configured
 */
export const isOneDriveConfigured = (): boolean => {
  return msalConfig.auth.clientId !== '';
};
