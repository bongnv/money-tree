import { LocalStorageProvider } from './index';
import type { DataFile } from '../../types/models';

/**
 * Tests for LocalStorageProvider
 */
describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;
  let mockData: DataFile;

  beforeEach(() => {
    provider = new LocalStorageProvider();
    mockData = {
      version: '1.0.0',
      years: {
        '2024': {
          transactions: [],
          budgets: [],
          manualAssets: [],
        },
      },
      accounts: [],
      categories: [],
      transactionTypes: [],
      archivedYears: [],
      lastModified: new Date().toISOString(),
    };
  });

  describe('checkSupport', () => {
    it('should throw error when File System Access API is not supported', async () => {
      // Save original functions
      const originalShowOpenFilePicker = (window as any).showOpenFilePicker;
      const originalShowSaveFilePicker = (window as any).showSaveFilePicker;

      // Remove API support
      delete (window as any).showOpenFilePicker;
      delete (window as any).showSaveFilePicker;

      await expect(provider.loadDataFile()).rejects.toThrow(
        'File System Access API is not supported'
      );

      // Restore original functions
      (window as any).showOpenFilePicker = originalShowOpenFilePicker;
      (window as any).showSaveFilePicker = originalShowSaveFilePicker;
    });
  });

  describe('loadDataFile', () => {
    it('should return null when user cancels file picker', async () => {
      // Mock showOpenFilePicker to throw AbortError
      (window as any).showOpenFilePicker = jest
        .fn()
        .mockRejectedValue(new DOMException('User cancelled', 'AbortError'));

      const result = await provider.loadDataFile();
      expect(result).toBeNull();
    });

    it('should throw error for invalid JSON', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue('invalid json'),
      };

      const mockFileHandle = {
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      (window as any).showOpenFilePicker = jest.fn().mockResolvedValue([mockFileHandle]);

      await expect(provider.loadDataFile()).rejects.toThrow();
    });

    it('should successfully load valid data file', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const mockFileHandle = {
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      (window as any).showOpenFilePicker = jest.fn().mockResolvedValue([mockFileHandle]);

      const result = await provider.loadDataFile();
      expect(result).toEqual(mockData);
    });

    it('should cache file handle after successful load', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const mockFileHandle = {
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      (window as any).showOpenFilePicker = jest.fn().mockResolvedValue([mockFileHandle]);

      await provider.loadDataFile();

      expect(provider.hasFileHandle()).toBe(true);
    });

    it('should handle data file with null arrays', async () => {
      const dataWithNulls = {
        version: '1.0.0',
        years: {},
        accounts: null,
        categories: null,
        transactionTypes: null,
        archivedYears: null,
        lastModified: new Date().toISOString(),
      };

      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(dataWithNulls)),
      };

      const mockFileHandle = {
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      (window as any).showOpenFilePicker = jest.fn().mockResolvedValue([mockFileHandle]);

      const result = await provider.loadDataFile();
      expect(result).toBeDefined();
      expect(result?.accounts).toEqual([]);
      expect(result?.categories).toEqual([]);
      expect(result?.transactionTypes).toEqual([]);
      expect(result?.archivedYears).toEqual([]);
    });

    it('should handle data file with missing arrays', async () => {
      const dataWithMissingArrays = {
        version: '1.0.0',
        years: {},
        lastModified: new Date().toISOString(),
      };

      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(dataWithMissingArrays)),
      };

      const mockFileHandle = {
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      (window as any).showOpenFilePicker = jest.fn().mockResolvedValue([mockFileHandle]);

      const result = await provider.loadDataFile();
      expect(result).toBeDefined();
      expect(result?.accounts).toEqual([]);
      expect(result?.categories).toEqual([]);
      expect(result?.transactionTypes).toEqual([]);
      expect(result?.archivedYears).toEqual([]);
    });
  });

  describe('saveDataFile', () => {
    it('should throw error for invalid data', async () => {
      const invalidData = { ...mockData, version: 123 } as any;

      await expect(provider.saveDataFile(invalidData)).rejects.toThrow();
    });

    it('should return without error when user cancels file picker', async () => {
      (window as any).showSaveFilePicker = jest
        .fn()
        .mockRejectedValue(new DOMException('User cancelled', 'AbortError'));

      await expect(provider.saveDataFile(mockData)).resolves.not.toThrow();
    });

    it('should successfully save data file', async () => {
      const mockWritable = {
        write: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockFileHandle = {
        createWritable: jest.fn().mockResolvedValue(mockWritable),
      };

      (window as any).showSaveFilePicker = jest.fn().mockResolvedValue(mockFileHandle);

      await provider.saveDataFile(mockData);

      expect(mockWritable.write).toHaveBeenCalledWith(JSON.stringify(mockData, null, 2));
      expect(mockWritable.close).toHaveBeenCalled();
    });

    it('should use cached file handle for subsequent saves', async () => {
      const mockWritable = {
        write: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const mockFileHandle = {
        createWritable: jest.fn().mockResolvedValue(mockWritable),
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      // First load to cache the handle
      (window as any).showOpenFilePicker = jest.fn().mockResolvedValue([mockFileHandle]);
      await provider.loadDataFile();

      // Save without showing picker
      await provider.saveDataFile(mockData);

      expect(mockFileHandle.createWritable).toHaveBeenCalled();
    });
  });

  describe('listAvailableYears', () => {
    it('should return empty array', async () => {
      const result = await provider.listAvailableYears();
      expect(result).toEqual([]);
    });
  });

  describe('clearFileHandle', () => {
    it('should remove cached file handle', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const mockFileHandle = {
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      (window as any).showOpenFilePicker = jest.fn().mockResolvedValue([mockFileHandle]);

      await provider.loadDataFile();
      expect(provider.hasFileHandle()).toBe(true);
      
      provider.clearFileHandle();
      expect(provider.hasFileHandle()).toBe(false);
    });
  });
});
