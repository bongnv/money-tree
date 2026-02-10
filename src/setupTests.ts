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
