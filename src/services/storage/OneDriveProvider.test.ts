/**
 * OneDriveProvider Tests
 */

import { OneDriveProvider, SelectedFileInfo } from './OneDriveProvider';
import { OneDriveService } from './OneDriveService';
import { DataFile } from '../../types/models';

// Mock OneDriveService
jest.mock('./OneDriveService');

describe('OneDriveProvider', () => {
  let provider: OneDriveProvider;
  let mockService: jest.Mocked<OneDriveService>;
  let mockFileInfo: SelectedFileInfo;

  const mockDataFile: DataFile = {
    version: '1.0.0',
    accounts: [],
    categories: [],
    transactionTypes: [],
    transactions: [],
    budgets: [],
    manualAssets: [],
    exchangeRates: [],
    archivedYears: [],
    baseCurrency: 'USD',
    lastModified: new Date().toISOString(),
  };

  beforeEach(() => {
    mockService = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    } as any;

    mockFileInfo = {
      fileId: 'file123',
      filePath: 'money-tree.json',
    };

    provider = new OneDriveProvider(mockService, mockFileInfo);
  });

  describe('getFileName', () => {
    it('should extract filename from path', () => {
      expect(provider.getFileName()).toBe('money-tree.json');
    });

    it('should extract filename from nested path', () => {
      mockFileInfo.filePath = 'folder/subfolder/data.json';
      provider = new OneDriveProvider(mockService, mockFileInfo);
      expect(provider.getFileName()).toBe('data.json');
    });

    it('should return default name for empty path', () => {
      mockFileInfo.filePath = '';
      provider = new OneDriveProvider(mockService, mockFileInfo);
      expect(provider.getFileName()).toBe('money-tree.json');
    });
  });

  describe('loadDataFile', () => {
    it('should throw error when fileId is not set', async () => {
      mockFileInfo.fileId = null;
      provider = new OneDriveProvider(mockService, mockFileInfo);

      await expect(provider.loadDataFile()).rejects.toThrow('Cannot load file: fileId is not set');
    });

    it('should load and parse data file for personal drive', async () => {
      mockService.readFile.mockResolvedValue(JSON.stringify(mockDataFile));

      const result = await provider.loadDataFile();

      expect(result).toEqual(mockDataFile);
      expect(mockService.readFile).toHaveBeenCalledWith('/me/drive/items/file123/content');
    });

    it('should load data file for shared folder', async () => {
      const sharedFileInfo: SelectedFileInfo = {
        fileId: 'file123',
        filePath: 'money-tree.json',
        driveId: 'drive456',
        parentItemId: 'parent789',
      };
      provider = new OneDriveProvider(mockService, sharedFileInfo);
      mockService.readFile.mockResolvedValue(JSON.stringify(mockDataFile));

      await provider.loadDataFile();

      expect(mockService.readFile).toHaveBeenCalledWith('/drives/drive456/items/file123/content');
    });

    it('should return null for 404 error', async () => {
      const error: any = new Error('Not found');
      error.statusCode = 404;
      mockService.readFile.mockRejectedValue(error);

      const result = await provider.loadDataFile();

      expect(result).toBeNull();
    });

    it('should throw permission error for 401', async () => {
      const error: any = new Error('Unauthorized');
      error.statusCode = 401;
      mockService.readFile.mockRejectedValue(error);

      await expect(provider.loadDataFile()).rejects.toThrow('OneDrive permission expired');
    });
  });

  describe('saveDataFile', () => {
    it('should create new file with path for personal drive', async () => {
      mockFileInfo.fileId = null;
      mockFileInfo.filePath = 'money-tree.json';
      provider = new OneDriveProvider(mockService, mockFileInfo);
      mockService.writeFile.mockResolvedValue({ id: 'newFile123' });

      await provider.saveDataFile(mockDataFile);

      expect(mockService.writeFile).toHaveBeenCalledWith(
        '/me/drive/root:/money-tree.json:/content',
        expect.any(String)
      );
    });

    it('should update existing file by ID', async () => {
      mockService.writeFile.mockResolvedValue({});

      await provider.saveDataFile(mockDataFile);

      expect(mockService.writeFile).toHaveBeenCalledWith(
        '/me/drive/items/file123/content',
        expect.any(String)
      );
    });

    it('should throw permission error for 403', async () => {
      const error: any = new Error('Forbidden');
      error.statusCode = 403;
      mockService.writeFile.mockRejectedValue(error);

      await expect(provider.saveDataFile(mockDataFile)).rejects.toThrow(
        'OneDrive permission expired'
      );
    });
  });

  describe('saveFile', () => {
    it('should save blob to same folder as main file', async () => {
      mockFileInfo.filePath = '/drive/root:/Documents/money-tree.json';
      provider = new OneDriveProvider(mockService, mockFileInfo);
      const blob = new Blob(['test']);

      await provider.saveFile(blob, 'backup.zip');

      expect(mockService.writeFile).toHaveBeenCalledWith(
        '/me/drive/root:/Documents/backup.zip:/content',
        blob
      );
    });

    it('should save blob to root when main file is in root', async () => {
      mockFileInfo.filePath = '/drive/root:/money-tree.json';
      provider = new OneDriveProvider(mockService, mockFileInfo);
      const blob = new Blob(['test']);

      await provider.saveFile(blob, 'backup.zip');

      expect(mockService.writeFile).toHaveBeenCalledWith(
        '/me/drive/root:/backup.zip:/content',
        blob
      );
    });

    it('should save blob to shared folder', async () => {
      mockFileInfo.driveId = 'drive456';
      mockFileInfo.parentItemId = 'parent789';
      provider = new OneDriveProvider(mockService, mockFileInfo);
      const blob = new Blob(['test']);

      await provider.saveFile(blob, 'backup.zip');

      expect(mockService.writeFile).toHaveBeenCalledWith(
        '/drives/drive456/items/parent789:/backup.zip:/content',
        blob
      );
    });
  });
});
