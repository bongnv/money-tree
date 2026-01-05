import { OneDriveService } from './OneDriveService';

// Mock MSAL and Graph client
jest.mock('@azure/msal-browser');
jest.mock('@microsoft/microsoft-graph-client');

describe('OneDriveService', () => {
  let service: OneDriveService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OneDriveService();
  });

  describe('constructor', () => {
    it('should create service instance', () => {
      expect(service).toBeInstanceOf(OneDriveService);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false initially', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should clear authentication state', () => {
      service.disconnect();
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
