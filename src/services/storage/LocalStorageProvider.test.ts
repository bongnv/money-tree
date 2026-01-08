import { LocalStorageProvider } from './index';
import type { DataFile } from '../../types/models';
import { CurrencyCode } from '../../types/enums';

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

const createMockDB = () => {
  const store: Record<string, any> = {};

  const mockObjectStore = {
    get: jest.fn((key: string) => {
      const request: any = {
        onsuccess: null,
        onerror: null,
        result: store[key],
      };
      // Trigger success asynchronously
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: request });
      }, 0);
      return request;
    }),
    put: jest.fn((value: any, key: string) => {
      store[key] = value;
      const request: any = {
        onsuccess: null,
        onerror: null,
      };
      // Trigger success asynchronously
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: request });
      }, 0);
      return request;
    }),
    delete: jest.fn((key: string) => {
      delete store[key];
      const request: any = {
        onsuccess: null,
        onerror: null,
      };
      // Trigger success asynchronously
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: request });
      }, 0);
      return request;
    }),
  };

  const mockTransaction = {
    objectStore: jest.fn(() => mockObjectStore),
    oncomplete: null as any,
    onerror: null as any,
  };

  // Auto-complete transactions
  setTimeout(() => {
    if (mockTransaction.oncomplete) mockTransaction.oncomplete();
  }, 10);

  return {
    objectStoreNames: { contains: jest.fn(() => false) },
    createObjectStore: jest.fn(() => mockObjectStore),
    transaction: jest.fn(() => {
      // Create new transaction instance each time
      const newTransaction = {
        objectStore: jest.fn(() => mockObjectStore),
        oncomplete: null as any,
        onerror: null as any,
      };
      // Auto-complete this transaction
      setTimeout(() => {
        if (newTransaction.oncomplete) newTransaction.oncomplete();
      }, 10);
      return newTransaction;
    }),
  };
};

/**
 * Create a mock file handle with permission methods
 */
const createMockFileHandle = (mockFile: any) => ({
  getFile: jest.fn().mockResolvedValue(mockFile),
  createWritable: jest.fn().mockResolvedValue({
    write: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  }),
  queryPermission: jest.fn().mockResolvedValue('granted'),
  requestPermission: jest.fn().mockResolvedValue('granted'),
});

/**
 * Tests for LocalStorageProvider
 */
describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;
  let mockData: DataFile;

  beforeEach(() => {
    // Setup IndexedDB mock
    const mockDB = createMockDB();
    const mockRequest: any = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDB,
    };

    mockIndexedDB.open.mockReturnValue(mockRequest);
    (global as any).indexedDB = mockIndexedDB;

    // Trigger success immediately
    setTimeout(() => {
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest });
      }
      // Trigger transactions to complete
      const transactions = mockDB.transaction();
      setTimeout(() => {
        if (transactions.oncomplete) transactions.oncomplete();
      }, 0);
    }, 0);

    provider = new LocalStorageProvider();
    mockData = {
      version: '1.0.0',
      transactions: [],
      budgets: [],
      manualAssets: [],
      exchangeRates: [],
      accounts: [],
      categories: [],
      transactionTypes: [],
      archivedYears: [],
      baseCurrency: CurrencyCode.USD,
      lastModified: new Date().toISOString(),
    };
  });

  describe('loadDataFile', () => {
    it('should throw error for invalid JSON', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue('invalid json'),
      };

      const mockFileHandle = createMockFileHandle(mockFile);
      provider = new LocalStorageProvider(mockFileHandle);

      await expect(provider.loadDataFile()).rejects.toThrow();
    });

    it('should successfully load valid data file', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const mockFileHandle = createMockFileHandle(mockFile);
      provider = new LocalStorageProvider(mockFileHandle);

      const result = await provider.loadDataFile();
      expect(result).toEqual(mockData);
    });

    it('should cache file handle after successful load', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const mockFileHandle = createMockFileHandle(mockFile);
      provider = new LocalStorageProvider(mockFileHandle);

      await provider.loadDataFile();
    });

    it('should handle data file with null arrays', async () => {
      const dataWithNulls = {
        version: '1.0.0',
        transactions: null,
        budgets: null,
        manualAssets: null,
        exchangeRates: null,
        accounts: null,
        categories: null,
        transactionTypes: null,
        archivedYears: null,
        lastModified: new Date().toISOString(),
      };

      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(dataWithNulls)),
      };

      const mockFileHandle = createMockFileHandle(mockFile);
      provider = new LocalStorageProvider(mockFileHandle);

      const result = await provider.loadDataFile();
      expect(result).toBeDefined();
      expect(result?.transactions).toEqual([]);
      expect(result?.budgets).toEqual([]);
      expect(result?.manualAssets).toEqual([]);
      expect(result?.exchangeRates).toEqual([]);
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

      const mockFileHandle = createMockFileHandle(mockFile);
      provider = new LocalStorageProvider(mockFileHandle);

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

    it('should successfully save data file', async () => {
      const mockWritable = {
        write: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockFileHandle = {
        createWritable: jest.fn().mockResolvedValue(mockWritable),
        queryPermission: jest.fn().mockResolvedValue('granted'),
        requestPermission: jest.fn().mockResolvedValue('granted'),
      };

      provider = new LocalStorageProvider(mockFileHandle as any);

      await provider.saveDataFile(mockData);

      expect(mockWritable.write).toHaveBeenCalledWith(JSON.stringify(mockData, null, 2));
      expect(mockWritable.close).toHaveBeenCalled();
    });

    it('should use cached file handle for subsequent saves', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const mockFileHandle = createMockFileHandle(mockFile);
      provider = new LocalStorageProvider(mockFileHandle);

      // Load to initialize
      await provider.loadDataFile();

      // Save without showing picker
      await provider.saveDataFile(mockData);

      expect(mockFileHandle.createWritable).toHaveBeenCalled();
    });
  });

  describe('permission handling', () => {
    it('should request read permission if not granted', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const mockFileHandle = {
        ...createMockFileHandle(mockFile),
        queryPermission: jest.fn().mockResolvedValue('prompt'),
        requestPermission: jest.fn().mockResolvedValue('granted'),
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      provider = new LocalStorageProvider(mockFileHandle);
      await provider.loadDataFile();

      expect(mockFileHandle.requestPermission).toHaveBeenCalledWith({ mode: 'read' });
    });

    it('should throw error if read permission denied', async () => {
      const mockFileHandle = {
        ...createMockFileHandle(null),
        queryPermission: jest.fn().mockResolvedValue('denied'),
        requestPermission: jest.fn().mockResolvedValue('denied'),
      };

      provider = new LocalStorageProvider(mockFileHandle);

      await expect(provider.loadDataFile()).rejects.toThrow(
        'File permission expired. Please select the file again to grant permission.'
      );
    });

    it('should request write permission if not granted', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const mockFileHandle = {
        ...createMockFileHandle(mockFile),
        queryPermission: jest
          .fn()
          .mockResolvedValueOnce('granted') // for read
          .mockResolvedValueOnce('prompt'), // for write
        requestPermission: jest.fn().mockResolvedValue('granted'),
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      provider = new LocalStorageProvider(mockFileHandle);
      await provider.loadDataFile(); // Initialize
      await provider.saveDataFile(mockData);

      expect(mockFileHandle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
    });

    it('should throw error if write permission denied', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      };

      const mockFileHandle = {
        ...createMockFileHandle(mockFile),
        queryPermission: jest
          .fn()
          .mockResolvedValueOnce('granted') // for read
          .mockResolvedValueOnce('denied'), // for write
        requestPermission: jest.fn().mockResolvedValue('denied'),
        getFile: jest.fn().mockResolvedValue(mockFile),
      };

      provider = new LocalStorageProvider(mockFileHandle);
      await provider.loadDataFile(); // Initialize

      await expect(provider.saveDataFile(mockData)).rejects.toThrow(
        'File permission expired. Please select the file again to grant permission.'
      );
    });

    it('should handle permission request failures', async () => {
      const mockFileHandle = {
        ...createMockFileHandle(null),
        queryPermission: jest.fn().mockResolvedValue('prompt'),
        requestPermission: jest.fn().mockRejectedValue(new Error('Permission request failed')),
      };

      provider = new LocalStorageProvider(mockFileHandle);

      await expect(provider.loadDataFile()).rejects.toThrow(
        'File permission expired. Please select the file again to grant permission.'
      );
    });
  });

  describe('saveFile', () => {
    beforeEach(() => {
      // Mock window.showSaveFilePicker
      (window as any).showSaveFilePicker = jest.fn();
    });

    it('should save ZIP file with file picker', async () => {
      const blob = new Blob(['test data']);
      const mockFileHandle = createMockFileHandle(null);
      (window as any).showSaveFilePicker = jest.fn().mockResolvedValue(mockFileHandle);

      await provider.saveFile(blob, 'backup.zip');

      expect(window.showSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: 'backup.zip',
        types: [
          {
            description: 'ZIP Archive',
            accept: {
              'application/zip': ['.zip'],
            },
          },
        ],
      });
      expect(mockFileHandle.createWritable).toHaveBeenCalled();
    });

    it('should handle user cancellation', async () => {
      const blob = new Blob(['test data']);
      const abortError = new DOMException('User cancelled', 'AbortError');
      (window as any).showSaveFilePicker = jest.fn().mockRejectedValue(abortError);

      await expect(provider.saveFile(blob, 'backup.zip')).rejects.toThrow('File save cancelled');
    });

    it('should rethrow non-abort errors', async () => {
      const blob = new Blob(['test data']);
      const error = new Error('Unknown error');
      (window as any).showSaveFilePicker = jest.fn().mockRejectedValue(error);

      await expect(provider.saveFile(blob, 'backup.zip')).rejects.toThrow('Unknown error');
    });
  });
});
