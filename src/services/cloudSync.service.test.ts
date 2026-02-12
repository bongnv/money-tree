import type { MoneyTreeDB } from '@/db/database';
import { CurrencyCode, AccountType } from '@/types/enums';
import type { DataFile, Transaction, Account, Category } from '@/types/models';
import { CloudSyncService } from './cloudSync.service';
import type { CloudService } from './cloud.service';

// Polyfill Blob.text() for tests
if (typeof Blob.prototype.text !== 'function') {
  Blob.prototype.text = async function () {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(this);
    });
  };
}

// Mock dependencies
const mockCloudService = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
} as unknown as CloudService;

const mockDb = {
  transactions: {
    toArray: jest.fn(),
    bulkPut: jest.fn(),
  },
  accounts: {
    toArray: jest.fn(),
    bulkPut: jest.fn(),
  },
  categories: {
    toArray: jest.fn(),
    bulkPut: jest.fn(),
  },
  transactionTypes: {
    toArray: jest.fn(),
    bulkPut: jest.fn(),
  },
  budgets: {
    toArray: jest.fn(),
    bulkPut: jest.fn(),
  },
  manualAssets: {
    toArray: jest.fn(),
    bulkPut: jest.fn(),
  },
  exchangeRates: {
    toArray: jest.fn(),
    bulkPut: jest.fn(),
  },
  syncMetadata: {
    get: jest.fn(),
    put: jest.fn(),
    bulkPut: jest.fn(),
  },
} as unknown as MoneyTreeDB;

describe('CloudSyncService', () => {
  let service: CloudSyncService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CloudSyncService(mockCloudService, mockDb);
  });

  describe('constructor', () => {
    it('should create an instance with cloud service and db', () => {
      expect(service).toBeInstanceOf(CloudSyncService);
    });
  });

  describe('fullSync', () => {
    const mockFileItem = { id: 'file1', name: 'data.json', isFolder: false };
    const mockTransaction: Transaction = {
      id: 'tx1',
      date: '2024-01-01',
      amount: 100,
      transactionTypeId: 'type1',
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    const mockAccount: Account = {
      id: 'acc1',
      name: 'Bank',
      type: AccountType.BANK_ACCOUNT,
      currencyCode: CurrencyCode.USD,
      initialBalance: 1000,
      isActive: true,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    const mockCategory: Category = {
      id: 'cat1',
      name: 'Food',
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    beforeEach(() => {
      // Setup default mock returns for local data
      (mockDb.transactions.toArray as jest.Mock).mockResolvedValue([mockTransaction]);
      (mockDb.accounts.toArray as jest.Mock).mockResolvedValue([mockAccount]);
      (mockDb.categories.toArray as jest.Mock).mockResolvedValue([mockCategory]);
      (mockDb.transactionTypes.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.budgets.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.manualAssets.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.exchangeRates.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.syncMetadata.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'baseCurrency') return Promise.resolve({ key, value: CurrencyCode.USD });
        if (key === 'archivedYears') return Promise.resolve({ key, value: [] });
        if (key === 'lastModified')
          return Promise.resolve({ key, value: '2024-01-01T00:00:00.000Z' });
        return Promise.resolve(undefined);
      });

      // Setup default mock returns for db writes
      (mockDb.transactions.bulkPut as jest.Mock).mockResolvedValue(undefined);
      (mockDb.accounts.bulkPut as jest.Mock).mockResolvedValue(undefined);
      (mockDb.categories.bulkPut as jest.Mock).mockResolvedValue(undefined);
      (mockDb.transactionTypes.bulkPut as jest.Mock).mockResolvedValue(undefined);
      (mockDb.budgets.bulkPut as jest.Mock).mockResolvedValue(undefined);
      (mockDb.manualAssets.bulkPut as jest.Mock).mockResolvedValue(undefined);
      (mockDb.exchangeRates.bulkPut as jest.Mock).mockResolvedValue(undefined);
      (mockDb.syncMetadata.bulkPut as jest.Mock).mockResolvedValue(undefined);
      (mockDb.syncMetadata.put as jest.Mock).mockResolvedValue(undefined);
    });

    it('should upload directly when file has no id (new file)', async () => {
      const newFileItem = { id: '', name: 'data.json', isFolder: false };
      const updatedFileItem = { id: 'new-file-id', name: 'data.json', isFolder: false };

      (mockCloudService.writeFile as jest.Mock).mockResolvedValue(updatedFileItem);

      const result = await service.fullSync(newFileItem);

      expect(mockCloudService.writeFile).toHaveBeenCalled();
      expect(mockCloudService.readFile).not.toHaveBeenCalled();
      expect(result.fileItem).toEqual(updatedFileItem);
      expect(result.mergedLastModified).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should download, merge, and upload when local has changes', async () => {
      const cloudData: DataFile = {
        version: '1.0',
        transactions: [],
        accounts: [],
        categories: [],
        transactionTypes: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        archivedYears: [],
        baseCurrency: CurrencyCode.USD,
        lastModified: '2023-12-31T00:00:00.000Z', // Older than local
      };

      const cloudBlob = new Blob([JSON.stringify(cloudData)], { type: 'application/json' });
      (mockCloudService.readFile as jest.Mock).mockResolvedValue(cloudBlob);
      (mockCloudService.writeFile as jest.Mock).mockResolvedValue(mockFileItem);

      const result = await service.fullSync(mockFileItem);

      expect(mockCloudService.readFile).toHaveBeenCalledWith(mockFileItem);
      expect(mockCloudService.writeFile).toHaveBeenCalled();
      expect(result.fileItem).toEqual(mockFileItem);
    });

    it('should download and merge without upload when remote is newer', async () => {
      const newerTransaction = { ...mockTransaction, updatedAt: '2024-01-02T00:00:00.000Z' };
      const cloudData: DataFile = {
        version: '1.0',
        transactions: [newerTransaction],
        accounts: [mockAccount],
        categories: [mockCategory],
        transactionTypes: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        archivedYears: [],
        baseCurrency: CurrencyCode.USD,
        lastModified: '2024-01-02T00:00:00.000Z',
      };

      const cloudBlob = new Blob([JSON.stringify(cloudData)], { type: 'application/json' });
      (mockCloudService.readFile as jest.Mock).mockResolvedValue(cloudBlob);

      const result = await service.fullSync(mockFileItem);

      expect(mockCloudService.readFile).toHaveBeenCalled();
      expect(mockCloudService.writeFile).not.toHaveBeenCalled();
      expect(mockDb.transactions.bulkPut).toHaveBeenCalledWith([newerTransaction]);
      expect(result.mergedLastModified).toBe('2024-01-02T00:00:00.000Z');
    });

    it('should handle invalid cloud data format', async () => {
      const invalidData = { invalid: 'data' };
      const cloudBlob = new Blob([JSON.stringify(invalidData)], { type: 'application/json' });
      (mockCloudService.readFile as jest.Mock).mockResolvedValue(cloudBlob);

      await expect(service.fullSync(mockFileItem)).rejects.toThrow('Invalid cloud data format');
    });

    it('should filter out soft-deleted items when uploading', async () => {
      const deletedTransaction = { ...mockTransaction, id: 'tx2', isDeleted: true };
      (mockDb.transactions.toArray as jest.Mock).mockResolvedValue([
        mockTransaction,
        deletedTransaction,
      ]);

      const newFileItem = { id: '', name: 'data.json', isFolder: false };
      const updatedFileItem = { id: 'new-file-id', name: 'data.json', isFolder: false };
      (mockCloudService.writeFile as jest.Mock).mockResolvedValue(updatedFileItem);

      await service.fullSync(newFileItem);

      const writeCall = (mockCloudService.writeFile as jest.Mock).mock.calls[0];
      const uploadedBlob = writeCall[1] as Blob;
      const uploadedContent = await uploadedBlob.text();
      const uploadedData = JSON.parse(uploadedContent) as DataFile;

      expect(uploadedData.transactions).toHaveLength(1);
      expect(uploadedData.transactions[0].id).toBe('tx1');
      expect(uploadedData.transactions.find((t) => t.id === 'tx2')).toBeUndefined();
    });

    it('should merge transactions using Last-Write-Wins', async () => {
      const localTx = { ...mockTransaction, id: 'tx1', updatedAt: '2024-01-02T00:00:00.000Z' };
      const remoteTx = { ...mockTransaction, id: 'tx1', updatedAt: '2024-01-01T00:00:00.000Z' };

      (mockDb.transactions.toArray as jest.Mock).mockResolvedValue([localTx]);

      const cloudData: DataFile = {
        version: '1.0',
        transactions: [remoteTx],
        accounts: [],
        categories: [],
        transactionTypes: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        archivedYears: [],
        baseCurrency: CurrencyCode.USD,
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const cloudBlob = new Blob([JSON.stringify(cloudData)], { type: 'application/json' });
      (mockCloudService.readFile as jest.Mock).mockResolvedValue(cloudBlob);
      (mockCloudService.writeFile as jest.Mock).mockResolvedValue(mockFileItem);

      await service.fullSync(mockFileItem);

      // Should upload because local is newer
      expect(mockCloudService.writeFile).toHaveBeenCalled();
      expect(mockDb.transactions.bulkPut).toHaveBeenCalledWith([localTx]);
    });

    it('should add new items from remote', async () => {
      const remoteTx = {
        ...mockTransaction,
        id: 'tx-remote',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const cloudData: DataFile = {
        version: '1.0',
        transactions: [remoteTx],
        accounts: [],
        categories: [],
        transactionTypes: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        archivedYears: [],
        baseCurrency: CurrencyCode.USD,
        lastModified: '2024-01-02T00:00:00.000Z',
      };

      const cloudBlob = new Blob([JSON.stringify(cloudData)], { type: 'application/json' });
      (mockCloudService.readFile as jest.Mock).mockResolvedValue(cloudBlob);

      await service.fullSync(mockFileItem);

      // Should merge both local and remote transactions
      const bulkPutCall = (mockDb.transactions.bulkPut as jest.Mock).mock.calls[0][0];
      expect(bulkPutCall).toHaveLength(2);
      expect(bulkPutCall.find((t: Transaction) => t.id === 'tx1')).toBeDefined();
      expect(bulkPutCall.find((t: Transaction) => t.id === 'tx-remote')).toBeDefined();
    });

    it('should handle metadata merge correctly', async () => {
      const cloudData: DataFile = {
        version: '1.0',
        transactions: [],
        accounts: [],
        categories: [],
        transactionTypes: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        archivedYears: [
          {
            year: 2023,
            archivedDate: '2024-01-01T00:00:00.000Z',
            summary: {
              transactionCount: 100,
              closingNetWorth: 5000,
              closingBalances: {},
              closingAssetValuations: {},
            },
          },
        ],
        baseCurrency: CurrencyCode.AUD,
        lastModified: '2024-01-02T00:00:00.000Z',
      };

      const cloudBlob = new Blob([JSON.stringify(cloudData)], { type: 'application/json' });
      (mockCloudService.readFile as jest.Mock).mockResolvedValue(cloudBlob);

      await service.fullSync(mockFileItem);

      // Remote metadata is newer, should use it
      expect(mockDb.syncMetadata.bulkPut).toHaveBeenCalledWith(
        expect.arrayContaining([
          { key: 'baseCurrency', value: CurrencyCode.AUD },
          expect.objectContaining({ key: 'archivedYears' }),
        ])
      );
    });

    it('should handle exchange rates merge', async () => {
      const localRate = {
        id: 'rate1',
        month: '2024-01',
        fromCurrency: CurrencyCode.USD,
        toCurrency: CurrencyCode.VND,
        rate: 24000,
        createdAt: '2024-01-02T00:00:00.000Z',
      };

      const remoteRate = {
        id: 'rate1',
        month: '2024-01',
        fromCurrency: CurrencyCode.USD,
        toCurrency: CurrencyCode.VND,
        rate: 23500,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (mockDb.exchangeRates.toArray as jest.Mock).mockResolvedValue([localRate]);

      const cloudData: DataFile = {
        version: '1.0',
        transactions: [],
        accounts: [],
        categories: [],
        transactionTypes: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [remoteRate],
        archivedYears: [],
        baseCurrency: CurrencyCode.USD,
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const cloudBlob = new Blob([JSON.stringify(cloudData)], { type: 'application/json' });
      (mockCloudService.readFile as jest.Mock).mockResolvedValue(cloudBlob);
      (mockCloudService.writeFile as jest.Mock).mockResolvedValue(mockFileItem);

      await service.fullSync(mockFileItem);

      // Local rate is newer, should be kept
      const bulkPutCall = (mockDb.exchangeRates.bulkPut as jest.Mock).mock.calls[0][0];
      expect(bulkPutCall).toHaveLength(1);
      expect(bulkPutCall[0].rate).toBe(24000);
      expect(bulkPutCall[0].createdAt).toBe('2024-01-02T00:00:00.000Z');
    });

    it('should preserve all local data types during sync', async () => {
      const cloudData: DataFile = {
        version: '1.0',
        transactions: [],
        accounts: [],
        categories: [],
        transactionTypes: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        archivedYears: [],
        baseCurrency: CurrencyCode.USD,
        lastModified: '2023-12-31T00:00:00.000Z',
      };

      const cloudBlob = new Blob([JSON.stringify(cloudData)], { type: 'application/json' });
      (mockCloudService.readFile as jest.Mock).mockResolvedValue(cloudBlob);
      (mockCloudService.writeFile as jest.Mock).mockResolvedValue(mockFileItem);

      await service.fullSync(mockFileItem);

      // All data types should be written to DB
      expect(mockDb.transactions.bulkPut).toHaveBeenCalled();
      expect(mockDb.accounts.bulkPut).toHaveBeenCalled();
      expect(mockDb.categories.bulkPut).toHaveBeenCalled();
      expect(mockDb.transactionTypes.bulkPut).toHaveBeenCalled();
      expect(mockDb.budgets.bulkPut).toHaveBeenCalled();
      expect(mockDb.manualAssets.bulkPut).toHaveBeenCalled();
      expect(mockDb.exchangeRates.bulkPut).toHaveBeenCalled();
      expect(mockDb.syncMetadata.bulkPut).toHaveBeenCalled();
    });
  });
});
