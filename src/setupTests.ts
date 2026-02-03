import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { webcrypto } from 'crypto';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock Web Crypto API for testing
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: webcrypto.subtle,
    randomUUID: webcrypto.randomUUID.bind(webcrypto),
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
  },
});

// Polyfill structuredClone for Node.js environments that don't have it
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
}

// Mock import.meta for Vite-specific code
jest.mock('./config/googledrive.config', () => ({
  googleDriveConfig: {
    clientId: '',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    redirectUri: 'http://localhost:3000',
  },
  driveApiConfig: {
    apiBaseUrl: 'https://www.googleapis.com/drive/v3',
    uploadUrl: 'https://www.googleapis.com/upload/drive/v3/files',
    jsonMimeType: 'application/json',
    folderMimeType: 'application/vnd.google-apps.folder',
  },
  errorMessages: {
    authRequired: 'Please authenticate with Google to access Google Drive',
    authFailed: 'Failed to authenticate with Google',
    uploadFailed: 'Failed to upload file to Google Drive',
    downloadFailed: 'Failed to download file from Google Drive',
    networkError: 'Network error. Please check your connection and try again',
    permissionDenied: 'Permission denied. Please grant access to Google Drive',
    configError:
      'Google Drive is not properly configured. Please check the Google Cloud Console setup.',
  },
  isGoogleDriveConfigured: () => false,
}));

jest.mock('./config/onedrive.config', () => ({
  oneDriveConfig: {
    clientId: '',
    authority: 'https://login.microsoftonline.com/consumers',
    redirectUri: 'http://localhost:3000',
    scopes: ['Files.ReadWrite.AppFolder'],
  },
  graphApiConfig: {
    apiBaseUrl: 'https://graph.microsoft.com/v1.0',
    driveEndpoint: '/me/drive',
    specialFolderPath: '/special/approot',
    uploadSessionEndpoint: '/createUploadSession',
  },
  errorMessages: {
    authRequired: 'Please authenticate with Microsoft to access OneDrive',
    authFailed: 'Failed to authenticate with Microsoft',
    uploadFailed: 'Failed to upload file to OneDrive',
    downloadFailed: 'Failed to download file from OneDrive',
    networkError: 'Network error. Please check your connection and try again',
    permissionDenied: 'Permission denied. Please grant access to OneDrive',
    configError: 'OneDrive is not properly configured. Please check the Azure setup.',
  },
  isOneDriveConfigured: () => false,
}));
