/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MoneyTreeDB } from '@/db/database';
import { CurrencyCode } from '@/types/enums';
import { ArchiveService } from './archive.service';
import type { CloudService } from './cloud.service';
import type { CloudItem } from './storage/IStorageProvider';

// Mock dependencies
const mockDb = {
  transactions: {
    toArray: jest.fn(),
    filter: jest.fn(() => ({
      toArray: jest.fn(),
      delete: jest.fn(),
    })),
  },
  accounts: {
    toArray: jest.fn(),
    update: jest.fn(),
  },
  manualAssets: {
    toArray: jest.fn(),
  },
  categories: {
    toArray: jest.fn(),
  },
  transactionTypes: {
    toArray: jest.fn(),
  },
  budgets: {
    toArray: jest.fn(),
    filter: jest.fn(() => ({
      toArray: jest.fn(),
    })),
    delete: jest.fn(),
  },
  exchangeRates: {
    toArray: jest.fn(),
    filter: jest.fn(() => ({
      toArray: jest.fn(),
    })),
  },
  syncMetadata: {
    get: jest.fn(),
    put: jest.fn(),
  },
} as unknown as MoneyTreeDB;

const mockCloudService: CloudService = {
  initialize: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  reconnect: jest.fn(),
  listFiles: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  getCurrentProvider: jest.fn(),
  getProviderName: jest.fn(() => 'OneDrive'),
  isAuthenticated: jest.fn(),
  createSyncService: jest.fn(),
} as unknown as CloudService;

describe('ArchiveService', () => {
  let archiveService: ArchiveService;

  beforeEach(() => {
    jest.clearAllMocks();
    archiveService = new ArchiveService(mockDb, mockCloudService);
  });

  describe('identifyArchivableYear', () => {
    it('should return null when no transactions exist', async () => {
      (mockDb.transactions.toArray as jest.Mock).mockResolvedValue([]);

      const result = await archiveService.identifyArchivableYear();

      expect(result).toBeNull();
    });

    it('should return null when only 2 years of data exist', async () => {
      (mockDb.transactions.toArray as jest.Mock).mockResolvedValue([
        { date: '2023-01-01', id: '1', isDeleted: false },
        { date: '2024-01-01', id: '2', isDeleted: false },
      ]);

      const result = await archiveService.identifyArchivableYear();

      expect(result).toBeNull();
    });

    it('should return oldest year when more than 2 years exist', async () => {
      (mockDb.transactions.toArray as jest.Mock).mockResolvedValue([
        { date: '2021-06-15', id: '1', isDeleted: false },
        { date: '2022-03-20', id: '2', isDeleted: false },
        { date: '2023-01-01', id: '3', isDeleted: false },
        { date: '2024-12-31', id: '4', isDeleted: false },
      ]);

      const result = await archiveService.identifyArchivableYear();

      expect(result).toBe(2021);
    });
  });

  describe('calculateYearEndSummary', () => {
    it('should calculate summary with closing balances and net worth', async () => {
      const mockTransactions = [
        {
          id: '1',
          date: '2023-06-15',
          amount: 1000,
          fromAccountId: 'acc1',
          toAccountId: 'acc2',
          isDeleted: false,
        },
      ];

      const mockAccounts = [
        {
          id: 'acc1',
          name: 'Checking',
          initialBalance: 5000,
          currencyCode: CurrencyCode.USD,
          isActive: true,
          isDeleted: false,
        },
        {
          id: 'acc2',
          name: 'Savings',
          initialBalance: 2000,
          currencyCode: CurrencyCode.USD,
          isActive: true,
          isDeleted: false,
        },
      ];

      (mockDb.transactions.toArray as jest.Mock).mockResolvedValue(mockTransactions);
      (mockDb.accounts.toArray as jest.Mock).mockResolvedValue(mockAccounts);
      (mockDb.manualAssets.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.exchangeRates.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.syncMetadata.get as jest.Mock).mockResolvedValue({ value: CurrencyCode.USD });

      const result = await archiveService.calculateYearEndSummary(2023);

      expect(result).toEqual({
        transactionCount: 1,
        closingNetWorth: 7000, // acc1: 4000 (5000-1000), acc2: 3000 (2000+1000) = 7000
        closingBalances: {
          acc1: 4000,
          acc2: 3000,
        },
        closingAssetValuations: {},
      });
    });
  });

  describe('archiveYear with cloud upload', () => {
    it('should require cloud upload and throw if provider not configured', async () => {
      const archiveServiceWithoutCloud = new ArchiveService(mockDb, mockCloudService);

      // Mock all required methods
      (mockDb.transactions.toArray as jest.Mock).mockResolvedValue([
        { id: '1', date: '2023-01-01', isDeleted: false },
        { id: '2', date: '2024-01-01', isDeleted: false },
      ]);
      (mockDb.accounts.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.manualAssets.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.exchangeRates.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.categories.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.transactionTypes.toArray as jest.Mock).mockResolvedValue([]);

      const mockFilterResult = {
        toArray: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      (mockDb.transactions.filter as jest.Mock).mockReturnValue(mockFilterResult);
      (mockDb.budgets.filter as jest.Mock).mockReturnValue(mockFilterResult);
      (mockDb.exchangeRates.filter as jest.Mock).mockReturnValue(mockFilterResult);

      (mockDb.syncMetadata.get as jest.Mock).mockResolvedValue({ value: CurrencyCode.USD });
      (mockDb.syncMetadata.put as jest.Mock).mockResolvedValue(undefined);

      await expect(archiveServiceWithoutCloud.archiveYear(2023, null as any)).rejects.toThrow();
    });
    it('should upload archive to cloud when provider is configured', async () => {
      const archiveFolder: CloudItem = {
        id: 'folder123',
        name: 'Archives',
        isFolder: true,
      };

      // Mock all required methods
      (mockDb.transactions.toArray as jest.Mock).mockResolvedValue([
        { id: '1', date: '2023-01-01', isDeleted: false },
        { id: '2', date: '2024-01-01', isDeleted: false },
      ]);
      (mockDb.accounts.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.manualAssets.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.exchangeRates.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.categories.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.transactionTypes.toArray as jest.Mock).mockResolvedValue([]);

      const mockFilterResult = {
        toArray: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      (mockDb.transactions.filter as jest.Mock).mockReturnValue(mockFilterResult);
      (mockDb.budgets.filter as jest.Mock).mockReturnValue(mockFilterResult);
      (mockDb.exchangeRates.filter as jest.Mock).mockReturnValue(mockFilterResult);

      (mockDb.syncMetadata.get as jest.Mock)
        .mockResolvedValueOnce({ value: CurrencyCode.USD }) // baseCurrency (for calculateYearEndSummary)
        .mockResolvedValueOnce(null); // archivedYears (for archiveYear - empty)
      (mockDb.syncMetadata.put as jest.Mock).mockResolvedValue(undefined);

      (mockCloudService.writeFile as jest.Mock).mockResolvedValue({
        id: 'file123',
        name: 'archive-2023.json',
        isFolder: false,
      });

      const result = await archiveService.archiveYear(2023, archiveFolder);

      expect(mockCloudService.writeFile).toHaveBeenCalled();
      expect(mockDb.syncMetadata.put).toHaveBeenCalledWith({
        key: 'archivedYears',
        value: [result],
      });
      expect(mockDb.syncMetadata.put).toHaveBeenCalledWith({
        key: 'lastModified',
        value: expect.any(String),
      });
      expect(result.year).toBe(2023);
    });

    it('should throw and not cleanup data if cloud upload fails', async () => {
      const archiveFolder: CloudItem = {
        id: 'folder123',
        name: 'Archives',
        isFolder: true,
      };

      // Mock all required methods
      (mockDb.transactions.toArray as jest.Mock).mockResolvedValue([
        { id: '1', date: '2023-01-01', isDeleted: false },
        { id: '2', date: '2024-01-01', isDeleted: false },
      ]);
      (mockDb.accounts.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.manualAssets.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.exchangeRates.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.categories.toArray as jest.Mock).mockResolvedValue([]);
      (mockDb.transactionTypes.toArray as jest.Mock).mockResolvedValue([]);

      const mockFilterResult = {
        toArray: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      (mockDb.transactions.filter as jest.Mock).mockReturnValue(mockFilterResult);
      (mockDb.budgets.filter as jest.Mock).mockReturnValue(mockFilterResult);
      (mockDb.exchangeRates.filter as jest.Mock).mockReturnValue(mockFilterResult);

      (mockDb.syncMetadata.get as jest.Mock).mockResolvedValue({ value: CurrencyCode.USD });
      (mockDb.syncMetadata.put as jest.Mock).mockResolvedValue(undefined);

      // Simulate cloud upload failure
      (mockCloudService.writeFile as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Should throw - archive fails if upload fails
      await expect(archiveService.archiveYear(2023, archiveFolder)).rejects.toThrow(
        'Failed to upload archive to cloud'
      );

      // Verify cleanup was NOT called (no delete operations)
      expect(mockFilterResult.delete).not.toHaveBeenCalled();
    });
  });
});
