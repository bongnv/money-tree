import { BudgetService } from './budget.service';
import { db } from '../db/database';
import type { Budget } from '../types/models';
import { CurrencyCode } from '../types/enums';
import type { SyncMetadataService } from './syncMetadata.service';

const mockSyncMetadataService = {
  setLastModified: jest.fn(),
} as unknown as SyncMetadataService;

jest.mock('../db/database', () => ({
  db: {
    budgets: {
      toArray: jest.fn(),
      get: jest.fn(),
      filter: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
    },
    syncMetadata: {
      put: jest.fn(),
      get: jest.fn(),
    },
  },
}));

describe('budgetService', () => {
  let budgetService: BudgetService;
  const mockBudget: Budget = {
    id: '1',
    transactionTypeId: '1',
    amount: 1000,
    currencyCode: CurrencyCode.USD,
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    budgetService = new BudgetService(db, mockSyncMetadataService);
  });

  describe('getAll', () => {
    it('should return all budgets', async () => {
      (db.budgets.toArray as jest.Mock).mockResolvedValue([mockBudget]);

      const result = await budgetService.getAll();

      expect(result).toEqual([mockBudget]);
    });
  });

  describe('getActive', () => {
    it('should return only non-deleted budgets', async () => {
      const mockFilter = {
        toArray: jest.fn().mockResolvedValue([mockBudget]),
      };
      (db.budgets.filter as jest.Mock).mockReturnValue(mockFilter);

      const result = await budgetService.getActive();

      expect(result).toEqual([mockBudget]);
    });
  });

  describe('create', () => {
    it('should create a new budget', async () => {
      const newBudget = {
        transactionTypeId: '2',
        amount: 500,
        currencyCode: CurrencyCode.USD,
        period: 'monthly' as const,
        startDate: '2024-02-01',
        endDate: '2024-12-31',
      };
      (db.budgets.add as jest.Mock).mockResolvedValue('2');

      const id = await budgetService.create(newBudget);

      expect(id).toBe('2');
      expect(db.budgets.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newBudget,
          isDeleted: false,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
    });
  });

  describe('update', () => {
    it('should update an existing budget', async () => {
      (db.budgets.get as jest.Mock).mockResolvedValue(mockBudget);
      (db.budgets.update as jest.Mock).mockResolvedValue(1);

      await budgetService.update('1', { amount: 1200 });

      expect(db.budgets.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          amount: 1200,
          updatedAt: expect.any(String),
        })
      );
    });

    it('should throw error if budget not found', async () => {
      (db.budgets.get as jest.Mock).mockResolvedValue(undefined);

      await expect(budgetService.update('999', { amount: 100 })).rejects.toThrow(
        'Budget with id 999 not found'
      );
    });
  });

  describe('delete', () => {
    it('should soft delete a budget', async () => {
      (db.budgets.get as jest.Mock).mockResolvedValue(mockBudget);
      (db.budgets.update as jest.Mock).mockResolvedValue(1);

      await budgetService.delete('1');

      expect(db.budgets.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          isDeleted: true,
        })
      );
    });
  });
});
