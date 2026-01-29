import { budgetService } from './budget.service';
import { db } from '../db/database';

jest.mock('./syncMetadata.service', () => ({
  syncMetadataService: {
    setLastModified: jest.fn(),
  },
}));

import type { Budget } from '../types/models';

jest.mock('../db/database', () => ({
  db: {
    budgets: {
      toArray: jest.fn(),
      get: jest.fn(),
      filter: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('budgetService', () => {
  const mockBudget: Budget = {
    id: 1,
    transactionTypeId: 1,
    amount: 1000,
    period: 'monthly',
    startDate: '2024-01-01',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
        transactionTypeId: 2,
        amount: 500,
        period: 'monthly' as const,
        startDate: '2024-02-01',
      };
      (db.budgets.add as jest.Mock).mockResolvedValue(2);

      const id = await budgetService.create(newBudget);

      expect(id).toBe(2);
      expect(db.budgets.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newBudget,
          isDeleted: false,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
      expect(
        syncMetadataService.setLastModified
      ).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing budget', async () => {
      (db.budgets.get as jest.Mock).mockResolvedValue(mockBudget);
      (db.budgets.update as jest.Mock).mockResolvedValue(1);

      await budgetService.update(1, { amount: 1200 });

      expect(db.budgets.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          amount: 1200,
          updatedAt: expect.any(String),
        })
      );
    });

    it('should throw error if budget not found', async () => {
      (db.budgets.get as jest.Mock).mockResolvedValue(undefined);

      await expect(budgetService.update(999, { amount: 100 })).rejects.toThrow(
        'Budget with id 999 not found'
      );
    });
  });

  describe('delete', () => {
    it('should soft delete a budget', async () => {
      (db.budgets.get as jest.Mock).mockResolvedValue(mockBudget);
      (db.budgets.update as jest.Mock).mockResolvedValue(1);

      await budgetService.delete(1);

      expect(db.budgets.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          isDeleted: true,
        })
      );
    });
  });
});
