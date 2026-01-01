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
      year: 2024,
      accounts: [],
      categories: [],
      transactionTypes: [],
      transactions: [],
      budgets: [],
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

      await expect(provider.loadDataFile(2024)).rejects.toThrow(
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
      (window as any).showOpenFilePicker = jest.fn().mockRejectedValue(
        new DOMException('User cancelled', 'AbortError')
      );

      const result = await provider.loadDataFile(2024);
      expect(result).toBeNull();
    });

    it('should throw error for invalid JSON', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue('invalid json'),
      };

      const mockFileHandle = {
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      (window as any).showOpenFilePicker = jest
        .fn()
        .mockResolvedValue([mockFileHandle]);

      await expect(provider.loadDataFile(2024)).rejects.toThrow();
    });

    it('should throw error when year mismatch', async () => {
      const wrongYearData = { ...mockData, year: 2023 };
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(wrongYearData)),
      };

      const mockFileHandle = {
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      (window as any).showOpenFilePicker = jest
        .fn()
        .mockResolvedValue([mockFileHandle]);

      await expect(provider.loadDataFile(2024)).rejects.toThrow('File year mismatch');
    });

    it('should successfully load valid data file', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const mockFileHandle = {
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      (window as any).showOpenFilePicker = jest
        .fn()
        .mockResolvedValue([mockFileHandle]);

      const result = await provider.loadDataFile(2024);
      expect(result).toEqual(mockData);
    });

    it('should cache file handle after successful load', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const mockFileHandle = {
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      (window as any).showOpenFilePicker = jest
        .fn()
        .mockResolvedValue([mockFileHandle]);

      await provider.loadDataFile(2024);

      const years = await provider.listAvailableYears();
      expect(years).toContain(2024);
    });
  });

  describe('saveDataFile', () => {
    it('should throw error for invalid data', async () => {
      const invalidData = { ...mockData, year: 'invalid' } as any;

      await expect(provider.saveDataFile(2024, invalidData)).rejects.toThrow();
    });

    it('should return without error when user cancels file picker', async () => {
      (window as any).showSaveFilePicker = jest.fn().mockRejectedValue(
        new DOMException('User cancelled', 'AbortError')
      );

      await expect(provider.saveDataFile(2024, mockData)).resolves.not.toThrow();
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

      await provider.saveDataFile(2024, mockData);

      expect(mockWritable.write).toHaveBeenCalledWith(
        JSON.stringify(mockData, null, 2)
      );
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
      (window as any).showOpenFilePicker = jest
        .fn()
        .mockResolvedValue([mockFileHandle]);
      await provider.loadDataFile(2024);

      // Save without showing picker
      await provider.saveDataFile(2024, mockData);

      expect(mockFileHandle.createWritable).toHaveBeenCalled();
    });
  });

  describe('listAvailableYears', () => {
    it('should return empty array when no file handles cached', async () => {
      const result = await provider.listAvailableYears();
      expect(result).toEqual([]);
    });

    it('should return sorted years descending', async () => {
      (window as any).showOpenFilePicker = jest.fn().mockImplementation(() => {
        const mockFile = {
          text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
        };

        const mockFileHandle = {
          getFile: jest.fn().mockResolvedValue(mockFile),
        };

        return Promise.resolve([mockFileHandle]);
      });

      // Load multiple years
      await provider.loadDataFile(2024);

      const data2023 = { ...mockData, year: 2023 };
      (window as any).showOpenFilePicker = jest.fn().mockImplementation(() => {
        const mockFile = {
          text: jest.fn().mockResolvedValue(JSON.stringify(data2023)),
        };

        const mockFileHandle = {
          getFile: jest.fn().mockResolvedValue(mockFile),
        };

        return Promise.resolve([mockFileHandle]);
      });
      await provider.loadDataFile(2023);

      const data2022 = { ...mockData, year: 2022 };
      (window as any).showOpenFilePicker = jest.fn().mockImplementation(() => {
        const mockFile = {
          text: jest.fn().mockResolvedValue(JSON.stringify(data2022)),
        };

        const mockFileHandle = {
          getFile: jest.fn().mockResolvedValue(mockFile),
        };

        return Promise.resolve([mockFileHandle]);
      });
      await provider.loadDataFile(2022);

      const result = await provider.listAvailableYears();
      expect(result).toEqual([2024, 2023, 2022]);
    });
  });

  describe('clearFileHandle', () => {
    it('should remove cached file handle for specific year', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const mockFileHandle = {
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      (window as any).showOpenFilePicker = jest
        .fn()
        .mockResolvedValue([mockFileHandle]);

      await provider.loadDataFile(2024);
      provider.clearFileHandle(2024);

      const years = await provider.listAvailableYears();
      expect(years).not.toContain(2024);
    });
  });

  describe('clearAllFileHandles', () => {
    it('should remove all cached file handles', async () => {
      // Load 2024
      (window as any).showOpenFilePicker = jest.fn().mockImplementation(() => {
        const mockFile = {
          text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
        };

        const mockFileHandle = {
          getFile: jest.fn().mockResolvedValue(mockFile),
        };

        return Promise.resolve([mockFileHandle]);
      });
      await provider.loadDataFile(2024);

      // Load 2023
      const data2023 = { ...mockData, year: 2023 };
      (window as any).showOpenFilePicker = jest.fn().mockImplementation(() => {
        const mockFile = {
          text: jest.fn().mockResolvedValue(JSON.stringify(data2023)),
        };

        const mockFileHandle = {
          getFile: jest.fn().mockResolvedValue(mockFile),
        };

        return Promise.resolve([mockFileHandle]);
      });
      await provider.loadDataFile(2023);

      provider.clearAllFileHandles();

      const years = await provider.listAvailableYears();
      expect(years).toEqual([]);
    });
  });
});

