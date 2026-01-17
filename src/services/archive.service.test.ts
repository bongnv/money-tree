/**
 * Archive Service Tests
 */

import { ArchiveService } from './archive.service';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useAssetStore } from '../stores/useAssetStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useExchangeRateStore } from '../stores/useExchangeRateStore';
import { useAppStore } from '../stores/useAppStore';
import { CalculationService } from './calculation.service';
import { StorageService } from './storage/StorageService';
import { CurrencyCode } from '../types/enums';

// Mock the stores
jest.mock('../stores/useTransactionStore');
jest.mock('../stores/useAccountStore');
jest.mock('../stores/useBudgetStore');
jest.mock('../stores/useAssetStore');
jest.mock('../stores/useCategoryStore');
jest.mock('../stores/useExchangeRateStore');
jest.mock('../stores/useAppStore');

// Create mock provider
const mockProvider = {
  saveAdditionalFile: jest.fn().mockResolvedValue(undefined),
};

// Create mock storage service
const mockStorageService = {
  fileName: 'test-file.json',
  providerName: 'Local File',
  provider: mockProvider,
  currentProvider: mockProvider,
  saveFile: jest.fn().mockImplementation(async (data: string | Blob, filename: string) => {
    // This should forward to provider.saveAdditionalFile
    return mockProvider.saveAdditionalFile(filename, data);
  }),
} as unknown as StorageService;

// Create mock calculation service
const mockCalculationService = {
  calculateAccountBalance: jest.fn(),
  calculateNetWorth: jest.fn(),
} as unknown as CalculationService;

describe('Archive Service', () => {
  let archiveService: ArchiveService;

  beforeEach(() => {
    jest.clearAllMocks();
    archiveService = new ArchiveService(mockStorageService, mockCalculationService);
  });

  describe('identifyArchivableYear', () => {
    it('should return only years at least 2 years older than current year', () => {
      // Set the system date to 2026-01-01
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-01'));

      (useTransactionStore.getState as jest.Mock).mockReturnValue({
        transactions: [
          {
            id: '1',
            date: '2025-01-15',
            description: 'Test',
            amount: 100,
            accountId: 'acc1',
            transactionTypeId: 'type1',
            createdAt: '2025-01-15T00:00:00Z',
            updatedAt: '2025-01-15T00:00:00Z',
          },
          {
            id: '2',
            date: '2023-03-20',
            description: 'Test',
            amount: 200,
            accountId: 'acc1',
            transactionTypeId: 'type1',
            createdAt: '2023-03-20T00:00:00Z',
            updatedAt: '2023-03-20T00:00:00Z',
          },
          {
            id: '3',
            date: '2024-06-10',
            description: 'Test',
            amount: 300,
            accountId: 'acc1',
            transactionTypeId: 'type1',
            createdAt: '2024-06-10T00:00:00Z',
            updatedAt: '2024-06-10T00:00:00Z',
          },
        ],
      });

      const year = archiveService.identifyArchivableYear();
      // Should return only the oldest eligible year (2023)
      // 2024 is cutoff year, so only 2023 and below are eligible
      // 2024 and 2025 are too recent (not at least 2 years old)
      expect(year).toBe(2023);

      jest.useRealTimers();
    });

    it('should return null when no transactions', () => {
      (useTransactionStore.getState as jest.Mock).mockReturnValue({
        transactions: [],
      });

      const year = archiveService.identifyArchivableYear();
      expect(year).toBeNull();
    });
  });

  describe('calculateYearEndSummary', () => {
    it('should calculate transaction count and estimated size', async () => {
      (useTransactionStore.getState as jest.Mock).mockReturnValue({
        transactions: [
          {
            id: '1',
            date: '2024-01-15',
            description: 'Test',
            amount: 100,
            accountId: 'acc1',
            transactionTypeId: 'type1',

            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
          {
            id: '2',
            date: '2024-06-20',
            description: 'Test',
            amount: 200,
            accountId: 'acc1',
            transactionTypeId: 'type1',

            createdAt: '2024-06-20T00:00:00Z',
            updatedAt: '2024-06-20T00:00:00Z',
          },
          {
            id: '3',
            date: '2025-03-10',
            description: 'Test',
            amount: 300,
            accountId: 'acc1',
            transactionTypeId: 'type1',

            createdAt: '2025-03-10T00:00:00Z',
            updatedAt: '2025-03-10T00:00:00Z',
          },
        ],
      });

      (useAccountStore.getState as jest.Mock).mockReturnValue({
        accounts: [],
      });

      (useAssetStore.getState as jest.Mock).mockReturnValue({
        manualAssets: [],
      });

      (useExchangeRateStore.getState as jest.Mock).mockReturnValue({
        rates: [],
        getRateForMonth: jest.fn(),
      });

      // Mock calculationService.calculateNetWorth
      const mockCalculateNetWorth = jest.fn().mockResolvedValue(75000);
      const mockCalculateAccountBalance = jest.fn().mockReturnValue(25000);
      (mockCalculationService as any).calculateNetWorth = mockCalculateNetWorth;
      (mockCalculationService as any).calculateAccountBalance = mockCalculateAccountBalance;

      const summary = await archiveService.calculateYearEndSummary(2024, 'USD' as CurrencyCode);

      expect(summary.transactionCount).toBe(2);
      expect(summary.closingNetWorth).toBe(75000);
      expect(summary.closingBalances).toBeDefined();
    });
  });

  describe('createArchiveFile', () => {
    it('should create archive file with year data', async () => {
      const mockTransactions = [
        {
          id: '1',
          date: '2024-01-15',
          description: 'Test 2024',
          amount: 100,
          fromAccountId: 'acc1',
          transactionTypeId: 'type1',
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        {
          id: '2',
          date: '2025-03-20',
          description: 'Test 2025',
          amount: 200,
          fromAccountId: 'acc1',
          transactionTypeId: 'type1',
          createdAt: '2025-03-20T00:00:00Z',
          updatedAt: '2025-03-20T00:00:00Z',
        },
      ];

      const mockBudgets = [
        {
          id: 'b1',
          transactionTypeId: 'type1',
          amount: 500,
          currencyCode: 'USD',
          period: 'monthly' as const,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'b2',
          transactionTypeId: 'type1',
          amount: 600,
          currencyCode: 'USD',
          period: 'monthly' as const,
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const mockAccounts = [
        {
          id: 'acc1',
          name: 'Test Account',
          currencyCode: 'USD',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockCategories = [
        {
          id: 'cat1',
          name: 'Test Category',
          color: '#000000',
          icon: 'icon',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockTransactionTypes = [
        {
          id: 'type1',
          name: 'Test Type',
          categoryId: 'cat1',
          group: 'income' as const,
          icon: 'icon',
          color: '#000000',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockExchangeRates = [
        {
          id: 'rate1',
          month: '2024-01',
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.1,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'rate2',
          month: '2025-01',
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.2,
          createdAt: '2025-01-01T00:00:00Z',
        },
      ];

      (useTransactionStore.getState as jest.Mock).mockReturnValue({
        transactions: mockTransactions,
      });

      (useBudgetStore.getState as jest.Mock).mockReturnValue({
        budgets: mockBudgets,
      });

      (useAssetStore.getState as jest.Mock).mockReturnValue({
        manualAssets: [],
      });

      (useAccountStore.getState as jest.Mock).mockReturnValue({
        accounts: mockAccounts,
      });

      (useCategoryStore.getState as jest.Mock).mockReturnValue({
        categories: mockCategories,
        transactionTypes: mockTransactionTypes,
      });

      (useExchangeRateStore.getState as jest.Mock).mockReturnValue({
        rates: mockExchangeRates,
        getRateForMonth: jest.fn(),
      });

      // Mock calculationService
      const mockCalculateNetWorth = jest.fn().mockResolvedValue(10000);
      const mockCalculateAccountBalance = jest.fn().mockReturnValue(5000);
      (mockCalculationService as any).calculateNetWorth = mockCalculateNetWorth;
      (mockCalculationService as any).calculateAccountBalance = mockCalculateAccountBalance;

      const archiveFile = await archiveService.createArchiveFile(2024, 'USD' as CurrencyCode);

      expect(archiveFile.version).toBe('1.0');
      expect(archiveFile.year).toBe(2024);
      expect(archiveFile.transactions).toHaveLength(1);
      expect(archiveFile.transactions[0].id).toBe('1');
      expect(archiveFile.budgets).toHaveLength(1);
      expect(archiveFile.budgets[0].id).toBe('b1');
      expect(archiveFile.accounts).toEqual(mockAccounts);
      expect(archiveFile.categories).toEqual(mockCategories);
      expect(archiveFile.transactionTypes).toEqual(mockTransactionTypes);
      expect(archiveFile.exchangeRates).toHaveLength(1);
      expect(archiveFile.exchangeRates[0].id).toBe('rate1');
      expect(archiveFile.archivedDate).toBeDefined();
      expect(archiveFile.summary.transactionCount).toBe(1);
      expect(archiveFile.summary.closingNetWorth).toBe(10000);
    });

    it('should filter manual asset history to year', async () => {
      const mockManualAssets = [
        {
          id: 'asset1',
          name: 'Test Asset',
          type: 'real_estate' as const,
          value: 1300,
          currencyCode: 'USD',
          date: '2025-01-01',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2024-12-31T00:00:00Z',
          valueHistory: [
            { date: '2023-12-01', value: 1000 },
            { date: '2024-06-01', value: 1100 },
            { date: '2024-12-01', value: 1200 },
            { date: '2025-01-01', value: 1300 },
          ],
        },
      ];

      (useTransactionStore.getState as jest.Mock).mockReturnValue({
        transactions: [],
      });

      (useBudgetStore.getState as jest.Mock).mockReturnValue({
        budgets: [],
      });

      (useAssetStore.getState as jest.Mock).mockReturnValue({
        manualAssets: mockManualAssets,
      });

      (useAccountStore.getState as jest.Mock).mockReturnValue({
        accounts: [],
      });

      (useCategoryStore.getState as jest.Mock).mockReturnValue({
        categories: [],
        transactionTypes: [],
      });

      (useExchangeRateStore.getState as jest.Mock).mockReturnValue({
        rates: [],
        getRateForMonth: jest.fn(),
      });

      const mockCalculateNetWorth = jest.fn().mockResolvedValue(1200);
      const mockCalculateAccountBalance = jest.fn().mockReturnValue(0);
      (mockCalculationService as any).calculateNetWorth = mockCalculateNetWorth;
      (mockCalculationService as any).calculateAccountBalance = mockCalculateAccountBalance;

      const archiveFile = await archiveService.createArchiveFile(2024, 'USD' as CurrencyCode);

      expect(archiveFile.manualAssets).toHaveLength(1);
      expect(archiveFile.manualAssets[0].valueHistory).toHaveLength(2);
      expect(archiveFile.manualAssets[0].valueHistory![0].date).toBe('2024-06-01');
      expect(archiveFile.manualAssets[0].valueHistory![1].date).toBe('2024-12-01');
    });
  });

  describe('saveArchiveFile', () => {
    // Use the same mockProvider from above
    const localMockProvider = {
      saveAdditionalFile: jest.fn().mockResolvedValue(undefined),
    };

    const localMockStorageService = {
      fileName: 'money-tree.json',
      providerName: 'Local File',
      provider: localMockProvider,
      currentProvider: localMockProvider,
      saveFile: jest.fn().mockImplementation(async (data: string | Blob, filename: string) => {
        return localMockProvider.saveAdditionalFile(filename, data);
      }),
    } as unknown as StorageService;

    let localArchiveService: ArchiveService;

    beforeEach(() => {
      jest.clearAllMocks();
      localArchiveService = new ArchiveService(localMockStorageService, mockCalculationService);
    });

    it('should save archive file with correct filename', async () => {
      const archiveFile = {
        version: '1.0',
        year: 2023,
        archivedDate: '2024-01-01T00:00:00Z',
        transactions: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        accounts: [],
        categories: [],
        transactionTypes: [],
        summary: {
          transactionCount: 0,
          closingNetWorth: 0,
          closingBalances: {},
          closingAssetValuations: {},
        },
      };

      await localArchiveService.saveArchiveFile(archiveFile);

      expect(localMockProvider.saveAdditionalFile).toHaveBeenCalledWith(
        'money-tree-2023.json',
        expect.any(String)
      );
    });

    it('should create blob with correct content', async () => {
      const archiveFile = {
        version: '1.0',
        year: 2024,
        archivedDate: '2024-01-01T00:00:00Z',
        transactions: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        accounts: [],
        categories: [],
        transactionTypes: [],
        summary: {
          transactionCount: 5,
          closingNetWorth: 1000,
          closingBalances: {},
          closingAssetValuations: {},
        },
      };

      await localArchiveService.saveArchiveFile(archiveFile);

      const stringArg = localMockProvider.saveAdditionalFile.mock.calls[0][1];
      expect(typeof stringArg).toBe('string');
      const savedArchive = JSON.parse(stringArg);
      expect(savedArchive).toEqual(archiveFile);
    });
  });

  describe('updateMainFileAfterArchive', () => {
    it('should remove transactions from archived year', () => {
      const mockSetTransactions = jest.fn();
      (useTransactionStore.getState as jest.Mock).mockReturnValue({
        transactions: [
          {
            id: '1',
            date: '2023-01-01',
            amount: 100,
            accountId: 'acc1',
            transactionTypeId: 'type1',
            description: 'Test',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
          {
            id: '2',
            date: '2024-01-01',
            amount: 200,
            accountId: 'acc1',
            transactionTypeId: 'type1',
            description: 'Test',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        setTransactions: mockSetTransactions,
      });

      (useAccountStore.getState as jest.Mock).mockReturnValue({
        accounts: [
          {
            id: 'acc1',
            name: 'Test',
            type: 'CHECKING',
            initialBalance: 0,
            currency: CurrencyCode.USD,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
        ],
        setAccounts: jest.fn(),
      });

      (useBudgetStore.getState as jest.Mock).mockReturnValue({
        budgets: [],
        setBudgets: jest.fn(),
      });

      (useAssetStore.getState as jest.Mock).mockReturnValue({
        manualAssets: [],
        setManualAssets: jest.fn(),
      });

      (useExchangeRateStore.getState as jest.Mock).mockReturnValue({
        rates: [],
        setRates: jest.fn(),
      });

      (useAppStore.getState as jest.Mock).mockReturnValue({
        archivedYears: [],
        addArchivedYear: jest.fn(),
      });

      (mockCalculationService.calculateAccountBalance as jest.Mock).mockReturnValue(500);

      const archiveReference = {
        year: 2023,
        archivedDate: '2024-01-01T00:00:00Z',
        summary: {
          transactionCount: 1,
          closingNetWorth: 500,
          closingBalances: {},
          closingAssetValuations: {},
        },
      };

      archiveService.updateMainFileAfterArchive(2023, archiveReference);

      expect(mockSetTransactions).toHaveBeenCalledWith([
        {
          id: '2',
          date: '2024-01-01',
          amount: 200,
          accountId: 'acc1',
          transactionTypeId: 'type1',
          description: 'Test',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]);
    });

    it('should update account initial balances', () => {
      const mockSetAccounts = jest.fn();
      (useTransactionStore.getState as jest.Mock).mockReturnValue({
        transactions: [
          {
            id: '1',
            date: '2023-01-01',
            amount: 100,
            accountId: 'acc1',
            transactionTypeId: 'type1',
            description: 'Test',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
        ],
        setTransactions: jest.fn(),
      });

      (useAccountStore.getState as jest.Mock).mockReturnValue({
        accounts: [
          {
            id: 'acc1',
            name: 'Test',
            type: 'CHECKING',
            initialBalance: 0,
            currency: CurrencyCode.USD,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
        ],
        setAccounts: mockSetAccounts,
      });

      (useBudgetStore.getState as jest.Mock).mockReturnValue({
        budgets: [],
        setBudgets: jest.fn(),
      });

      (useAssetStore.getState as jest.Mock).mockReturnValue({
        manualAssets: [],
        setManualAssets: jest.fn(),
      });

      (useExchangeRateStore.getState as jest.Mock).mockReturnValue({
        rates: [],
        setRates: jest.fn(),
      });

      (useAppStore.getState as jest.Mock).mockReturnValue({
        archivedYears: [],
        addArchivedYear: jest.fn(),
      });

      (mockCalculationService.calculateAccountBalance as jest.Mock).mockReturnValue(1000);

      const archiveReference = {
        year: 2023,
        archivedDate: '2024-01-01T00:00:00Z',
        summary: {
          transactionCount: 1,
          closingNetWorth: 1000,
          closingBalances: {},
          closingAssetValuations: {},
        },
      };

      archiveService.updateMainFileAfterArchive(2023, archiveReference);

      expect(mockSetAccounts).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'acc1',
          initialBalance: 1000,
        }),
      ]);
    });

    it('should add archive reference to app state', () => {
      const mockAddArchivedYear = jest.fn();
      (useTransactionStore.getState as jest.Mock).mockReturnValue({
        transactions: [],
        setTransactions: jest.fn(),
      });

      (useAccountStore.getState as jest.Mock).mockReturnValue({
        accounts: [],
        setAccounts: jest.fn(),
      });

      (useBudgetStore.getState as jest.Mock).mockReturnValue({
        budgets: [],
        setBudgets: jest.fn(),
      });

      (useAssetStore.getState as jest.Mock).mockReturnValue({
        manualAssets: [],
        setManualAssets: jest.fn(),
      });

      (useExchangeRateStore.getState as jest.Mock).mockReturnValue({
        rates: [],
        setRates: jest.fn(),
      });

      (useAppStore.getState as jest.Mock).mockReturnValue({
        archivedYears: [],
        addArchivedYear: mockAddArchivedYear,
      });

      (mockCalculationService.calculateAccountBalance as jest.Mock).mockReturnValue(0);

      const archiveReference = {
        year: 2023,
        archivedDate: '2024-01-01T00:00:00Z',
        summary: {
          transactionCount: 0,
          closingNetWorth: 0,
          closingBalances: {},
          closingAssetValuations: {},
        },
      };

      archiveService.updateMainFileAfterArchive(2023, archiveReference);

      expect(mockAddArchivedYear).toHaveBeenCalledWith(archiveReference);
    });
  });

  describe('getArchivedYears', () => {
    it('should return archived years from app store', () => {
      const archivedYears = [
        {
          year: 2022,
          archivedDate: '2023-01-01T00:00:00Z',
          summary: {
            transactionCount: 100,
            closingNetWorth: 5000,
            closingBalances: {},
            closingAssetValuations: {},
          },
        },
        {
          year: 2023,
          archivedDate: '2024-01-01T00:00:00Z',
          summary: { transactionCount: 150, closingNetWorth: 6000, closingBalances: {} },
        },
      ];

      (useAppStore.getState as jest.Mock).mockReturnValue({
        archivedYears,
      });

      const result = archiveService.getArchivedYears();

      expect(result).toEqual(archivedYears);
      expect(result).toHaveLength(2);
    });
  });
});
