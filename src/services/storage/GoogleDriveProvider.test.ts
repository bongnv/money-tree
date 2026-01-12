import { GoogleDriveProvider } from './GoogleDriveProvider';
import { GoogleDriveService } from './GoogleDriveService';
import { DataFile } from '../../types/models';

// Mock GoogleDriveService
jest.mock('./GoogleDriveService');

describe('GoogleDriveProvider', () => {
  let provider: GoogleDriveProvider;
  let mockService: jest.Mocked<GoogleDriveService>;

  const mockFileInfo = {
    fileId: 'test-file-id',
    fileName: 'test-file.json',
    parentId: 'parent-folder-id',
  };

  const mockDataFile: DataFile = {
    version: '1.0',
    lastModified: new Date().toISOString(),
    transactions: [],
    budgets: [],
    manualAssets: [],
    exchangeRates: [],
    accounts: [],
    categories: [],
    transactionTypes: [],
    archivedYears: [],
    baseCurrency: 'USD',
  };

  beforeEach(() => {
    mockService = {
      readFile: jest.fn(),
      createFile: jest.fn(),
      updateFile: jest.fn(),
    } as any;

    provider = new GoogleDriveProvider(mockService, mockFileInfo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFileName', () => {
    it('should return the correct file name', () => {
      expect(provider.getFileName()).toBe('test-file.json');
    });

    it('should return default name when fileName is empty', () => {
      const emptyProvider = new GoogleDriveProvider(mockService, {
        fileId: null,
        fileName: '',
      });
      expect(emptyProvider.getFileName()).toBe('money-tree.json');
    });
  });

  describe('getName', () => {
    it('should return provider name', () => {
      expect(provider.getName()).toBe('Google Drive');
    });
  });

  describe('loadDataFile', () => {
    it('should throw error when fileId is not set', async () => {
      const newFileProvider = new GoogleDriveProvider(mockService, {
        fileId: null,
        fileName: 'new-file.json',
      });

      await expect(newFileProvider.loadDataFile()).rejects.toThrow(
        'Cannot load file: fileId is not set'
      );
      expect(mockService.readFile).not.toHaveBeenCalled();
    });

    it('should load and parse existing file', async () => {
      const fileContent = JSON.stringify(mockDataFile);
      mockService.readFile.mockResolvedValue(fileContent);

      const result = await provider.loadDataFile();

      expect(mockService.readFile).toHaveBeenCalledWith('test-file-id');
      expect(result).toEqual(mockDataFile);
    });

    it('should return null for 404 errors', async () => {
      mockService.readFile.mockRejectedValue(new Error('File not found in Google Drive.'));

      const result = await provider.loadDataFile();
      expect(result).toBeNull();
    });

    it('should throw user-friendly error for auth errors', async () => {
      mockService.readFile.mockRejectedValue(new Error('Authentication expired'));

      await expect(provider.loadDataFile()).rejects.toThrow(
        'Google Drive permission expired. Please reconnect your account in Settings → Data & Sync.'
      );
    });
  });

  describe('saveDataFile', () => {
    it('should create new file when fileId is null', async () => {
      const newFileProvider = new GoogleDriveProvider(mockService, {
        fileId: null,
        fileName: 'new-file.json',
        parentId: 'parent-id',
      });

      mockService.createFile.mockResolvedValue({
        id: 'new-file-id',
        name: 'new-file.json',
        mimeType: 'application/json',
      });

      await newFileProvider.saveDataFile(mockDataFile);

      expect(mockService.createFile).toHaveBeenCalledWith(
        'new-file.json',
        expect.any(String),
        'parent-id'
      );
    });

    it('should update existing file when fileId exists', async () => {
      mockService.updateFile.mockResolvedValue({
        id: 'test-file-id',
        name: 'test-file.json',
        mimeType: 'application/json',
      });

      await provider.saveDataFile(mockDataFile);

      expect(mockService.updateFile).toHaveBeenCalledWith('test-file-id', expect.any(String));
    });

    it('should throw user-friendly error for auth errors', async () => {
      mockService.updateFile.mockRejectedValue(new Error('Authentication expired'));

      await expect(provider.saveDataFile(mockDataFile)).rejects.toThrow(
        'Google Drive permission expired. Please reconnect your account in Settings → Data & Sync.'
      );
    });
  });

  describe('saveFile', () => {
    it('should save file to same parent folder', async () => {
      mockService.createFile.mockResolvedValue({
        id: 'backup-file-id',
        name: 'backup.zip',
        mimeType: 'application/zip',
      });

      await provider.saveFile('backup content', 'backup.zip');

      expect(mockService.createFile).toHaveBeenCalledWith(
        'backup.zip',
        'backup content',
        'parent-folder-id'
      );
    });

    it('should handle binary data (Uint8Array)', async () => {
      const binaryData = new Uint8Array([1, 2, 3, 4]);
      mockService.createFile.mockResolvedValue({
        id: 'binary-file-id',
        name: 'data.bin',
        mimeType: 'application/octet-stream',
      });

      await provider.saveFile(binaryData, 'data.bin');

      expect(mockService.createFile).toHaveBeenCalledWith(
        'data.bin',
        binaryData,
        'parent-folder-id'
      );
    });
  });
});
