import { LocalStorageProvider } from './index';
import type { DataFile } from '../../types/models';

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
      years: {
        '2024': {
          transactions: [],
          budgets: [],
          manualAssets: [],
          exchangeRates: [],
        },
      },
      accounts: [],
      categories: [],
      transactionTypes: [],
      archivedYears: [],
      baseCurrency: 'usd',
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

      const mockFileHandle = createMockFileHandle(mockFile);
      provider = new LocalStorageProvider(mockFileHandle);

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
});
