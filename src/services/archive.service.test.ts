/**
 * Archive Service Tests
 */

import {
  detectArchiveTrigger,
  calculateYearEndSummary,
  identifyArchivableYears,
  shouldPromptArchive,
} from './archive.service';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useAccountStore } from '../stores/useAccountStore';
import { calculationService } from './calculation.service';

// Mock the stores
jest.mock('../stores/useTransactionStore');
jest.mock('../stores/useAccountStore');

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

      // Mock calculationService.calculateNetWorth
      const mockCalculateNetWorth = jest.fn().mockReturnValue(75000);
      (calculationService as any).calculateNetWorth = mockCalculateNetWorth;

      const summary = calculateYearEndSummary(2024, 'usd');

      expect(summary.year).toBe(2024);
      expect(summary.transactionCount).toBe(2);
      expect(summary.netWorth).toBe(75000);
      expect(summary.estimatedSizeKB).toBeGreaterThan(0);
    });
  });
});
