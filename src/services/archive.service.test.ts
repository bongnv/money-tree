/**
 * Archive Service Tests
 */

import {
  detectArchiveTrigger,
  calculateYearEndSummary,
  identifyArchivableYears,
  shouldPromptArchive,
  createArchiveFile,
} from './archive.service';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useAssetStore } from '../stores/useAssetStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { calculationService } from './calculation.service';

// Mock the stores
jest.mock('../stores/useTransactionStore');
jest.mock('../stores/useAccountStore');
jest.mock('../stores/useBudgetStore');
jest.mock('../stores/useAssetStore');
jest.mock('../stores/useCategoryStore');

describe('Archive Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectArchiveTrigger', () => {
    it('should return false when less than 3 years exist', () => {
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
            date: '2025-03-20',
            description: 'Test',
            amount: 200,
            accountId: 'acc1',
            transactionTypeId: 'type1',
            createdAt: '2025-03-20T00:00:00Z',
            updatedAt: '2025-03-20T00:00:00Z',
          },
        ],
      });

      expect(detectArchiveTrigger()).toBe(false);
    });

    it('should return true when 3 or more years exist', () => {
      (useTransactionStore.getState as jest.Mock).mockReturnValue({
        transactions: [
          {
            id: '1',
            date: '2023-01-15',
            description: 'Test',
            amount: 100,
            accountId: 'acc1',
            transactionTypeId: 'type1',

            createdAt: '2023-01-15T00:00:00Z',
            updatedAt: '2023-01-15T00:00:00Z',
          },
          {
            id: '2',
            date: '2024-03-20',
            description: 'Test',
            amount: 200,
            accountId: 'acc1',
            transactionTypeId: 'type1',

            createdAt: '2024-03-20T00:00:00Z',
            updatedAt: '2024-03-20T00:00:00Z',
          },
          {
            id: '3',
            date: '2025-06-10',
            description: 'Test',
            amount: 300,
            accountId: 'acc1',
            transactionTypeId: 'type1',

            createdAt: '2025-06-10T00:00:00Z',
            updatedAt: '2025-06-10T00:00:00Z',
          },
        ],
      });

      expect(detectArchiveTrigger()).toBe(true);
    });
  });

  describe('identifyArchivableYears', () => {
    it('should return years sorted from oldest to newest', () => {
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

      const years = identifyArchivableYears();
      expect(years).toEqual([2023, 2024, 2025]);
    });

    it('should return empty array when no transactions', () => {
      (useTransactionStore.getState as jest.Mock).mockReturnValue({
        transactions: [],
      });

      const years = identifyArchivableYears();
      expect(years).toEqual([]);
    });
  });

  describe('shouldPromptArchive', () => {
    beforeEach(() => {
      // Mock 3 years of data
      (useTransactionStore.getState as jest.Mock).mockReturnValue({
        transactions: [
          {
            id: '1',
            date: '2023-01-15',
            description: 'Test',
            amount: 100,
            accountId: 'acc1',
            transactionTypeId: 'type1',

            createdAt: '2023-01-15T00:00:00Z',
            updatedAt: '2023-01-15T00:00:00Z',
          },
          {
            id: '2',
            date: '2024-03-20',
            description: 'Test',
            amount: 200,
            accountId: 'acc1',
            transactionTypeId: 'type1',

            createdAt: '2024-03-20T00:00:00Z',
            updatedAt: '2024-03-20T00:00:00Z',
          },
          {
            id: '3',
            date: '2025-06-10',
            description: 'Test',
            amount: 300,
            accountId: 'acc1',
            transactionTypeId: 'type1',

            createdAt: '2025-06-10T00:00:00Z',
            updatedAt: '2025-06-10T00:00:00Z',
          },
        ],
      });
    });

    it('should return true when never postponed and 3+ years exist', () => {
      expect(shouldPromptArchive(null)).toBe(true);
    });

    it('should return false when postponed less than 30 days ago', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      expect(shouldPromptArchive(tenDaysAgo.toISOString())).toBe(false);
    });

    it('should return true when postponed 30+ days ago', () => {
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

      expect(shouldPromptArchive(fortyDaysAgo.toISOString())).toBe(true);
    });

    it('should return false when less than 3 years exist', () => {
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
        ],
      });

      expect(shouldPromptArchive(null)).toBe(false);
    });
  });

  describe('calculateYearEndSummary', () => {
    it('should calculate transaction count and estimated size', () => {
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

      // Mock calculationService.calculateNetWorth
      const mockCalculateNetWorth = jest.fn().mockReturnValue(75000);
      const mockCalculateAccountBalance = jest.fn().mockReturnValue(25000);
      (calculationService as any).calculateNetWorth = mockCalculateNetWorth;
      (calculationService as any).calculateAccountBalance = mockCalculateAccountBalance;

      const summary = calculateYearEndSummary(2024, 'USD');

      expect(summary.transactionCount).toBe(2);
      expect(summary.closingNetWorth).toBe(75000);
      expect(summary.closingBalances).toBeDefined();
    });
  });

  describe('createArchiveFile', () => {
    it('should create archive file with year data', () => {
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

      // Mock calculationService
      const mockCalculateNetWorth = jest.fn().mockReturnValue(10000);
      const mockCalculateAccountBalance = jest.fn().mockReturnValue(5000);
      (calculationService as any).calculateNetWorth = mockCalculateNetWorth;
      (calculationService as any).calculateAccountBalance = mockCalculateAccountBalance;

      const archiveFile = createArchiveFile(2024, 'USD');

      expect(archiveFile.version).toBe('1.0');
      expect(archiveFile.year).toBe(2024);
      expect(archiveFile.transactions).toHaveLength(1);
      expect(archiveFile.transactions[0].id).toBe('1');
      expect(archiveFile.budgets).toHaveLength(1);
      expect(archiveFile.budgets[0].id).toBe('b1');
      expect(archiveFile.accounts).toEqual(mockAccounts);
      expect(archiveFile.categories).toEqual(mockCategories);
      expect(archiveFile.transactionTypes).toEqual(mockTransactionTypes);
      expect(archiveFile.archivedDate).toBeDefined();
      expect(archiveFile.summary.transactionCount).toBe(1);
      expect(archiveFile.summary.closingNetWorth).toBe(10000);
    });

    it('should filter manual asset history to year', () => {
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

      const mockCalculateNetWorth = jest.fn().mockReturnValue(1200);
      const mockCalculateAccountBalance = jest.fn().mockReturnValue(0);
      (calculationService as any).calculateNetWorth = mockCalculateNetWorth;
      (calculationService as any).calculateAccountBalance = mockCalculateAccountBalance;

      const archiveFile = createArchiveFile(2024, 'USD');

      expect(archiveFile.manualAssets).toHaveLength(1);
      expect(archiveFile.manualAssets[0].valueHistory).toHaveLength(2);
      expect(archiveFile.manualAssets[0].valueHistory![0].date).toBe('2024-06-01');
      expect(archiveFile.manualAssets[0].valueHistory![1].date).toBe('2024-12-01');
    });
  });
});
