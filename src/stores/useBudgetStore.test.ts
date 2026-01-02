import { renderHook, act } from '@testing-library/react';
import { useBudgetStore } from './useBudgetStore';
import { useAppStore } from './useAppStore';
import type { Budget } from '../types/models';

// Mock useAppStore
jest.mock('./useAppStore', () => ({
  useAppStore: {
    getState: jest.fn(() => ({
      setUnsavedChanges: jest.fn(),
    })),
  },
}));

describe('useBudgetStore', () => {
  let mockSetUnsavedChanges: jest.Mock;

  beforeEach(() => {
    mockSetUnsavedChanges = jest.fn();
    (useAppStore.getState as jest.Mock) = jest.fn(() => ({
      setUnsavedChanges: mockSetUnsavedChanges,
    }));

    const { result } = renderHook(() => useBudgetStore());
    act(() => {
      result.current.resetBudgets();
    });
  });

  describe('initial state', () => {
    it('should have empty budget items initially', () => {
      const { result } = renderHook(() => useBudgetStore());
      expect(result.current.budgets).toEqual([]);
    });
  });

  describe('setBudgets', () => {
    it('should set budget items', () => {
      const { result } = renderHook(() => useBudgetStore());
      const budgets: Budget[] = [
        {
          id: '1',
          transactionTypeId: 'tt1',
          amount: 500,
          period: 'monthly',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      act(() => {
        result.current.setBudgets(budgets);
      });

      expect(result.current.budgets).toEqual(budgets);
    });
  });

  describe('addBudget', () => {
    it('should add a budget item', () => {
      const { result } = renderHook(() => useBudgetStore());
      const budget: Budget = {
        id: '1',
        transactionTypeId: 'tt1',
        amount: 500,
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      act(() => {
        result.current.addBudget(budget);
      });

      expect(result.current.budgets).toContainEqual(budget);
      expect(mockSetUnsavedChanges).toHaveBeenCalledWith(true);
    });
  });

  describe('updateBudget', () => {
    it('should update a budget item', () => {
      const { result } = renderHook(() => useBudgetStore());
      const budget: Budget = {
        id: '1',
        transactionTypeId: 'tt1',
        amount: 500,
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      act(() => {
        result.current.addBudget(budget);
      });

      act(() => {
        result.current.updateBudget('1', { amount: 600 });
      });

      const updated = result.current.budgets.find((item) => item.id === '1');
      expect(updated?.amount).toBe(600);
      expect(mockSetUnsavedChanges).toHaveBeenCalled();
    });

    it('should update updatedAt timestamp', () => {
      const { result } = renderHook(() => useBudgetStore());
      const originalDate = '2026-01-01T00:00:00.000Z';
      const budget: Budget = {
        id: '1',
        transactionTypeId: 'tt1',
        amount: 500,
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: originalDate,
        updatedAt: originalDate,
      };

      act(() => {
        result.current.addBudget(budget);
      });

      act(() => {
        result.current.updateBudget('1', { amount: 600 });
      });

      const updated = result.current.budgets.find((item) => item.id === '1');
      expect(updated?.updatedAt).not.toBe(originalDate);
    });
  });

  describe('deleteBudget', () => {
    it('should delete a budget item', () => {
      const { result } = renderHook(() => useBudgetStore());
      const budget: Budget = {
        id: '1',
        transactionTypeId: 'tt1',
        amount: 500,
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      act(() => {
        result.current.addBudget(budget);
      });

      act(() => {
        result.current.deleteBudget('1');
      });

      expect(result.current.budgets).not.toContainEqual(budget);
      expect(mockSetUnsavedChanges).toHaveBeenCalled();
    });
  });

  describe('getBudgetById', () => {
    it('should return budget item by id', () => {
      const { result } = renderHook(() => useBudgetStore());
      const budget: Budget = {
        id: '1',
        transactionTypeId: 'tt1',
        amount: 500,
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      act(() => {
        result.current.addBudget(budget);
      });

      const found = result.current.getBudgetById('1');
      expect(found).toEqual(budget);
    });

    it('should return undefined for non-existent id', () => {
      const { result } = renderHook(() => useBudgetStore());
      const found = result.current.getBudgetById('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('getBudgetByTransactionTypeId', () => {
    it('should return budget item by transaction type id', () => {
      const { result } = renderHook(() => useBudgetStore());
      const budget: Budget = {
        id: '1',
        transactionTypeId: 'tt1',
        amount: 500,
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      act(() => {
        result.current.addBudget(budget);
      });

      const found = result.current.getBudgetByTransactionTypeId('tt1');
      expect(found).toEqual(budget);
    });

    it('should return undefined for non-existent transaction type id', () => {
      const { result } = renderHook(() => useBudgetStore());
      const found = result.current.getBudgetByTransactionTypeId('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('resetBudgets', () => {
    it('should reset budget items to empty array', () => {
      const { result } = renderHook(() => useBudgetStore());
      const budget: Budget = {
        id: '1',
        transactionTypeId: 'tt1',
        amount: 500,
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      act(() => {
        result.current.addBudget(budget);
      });

      act(() => {
        result.current.resetBudgets();
      });

      expect(result.current.budgets).toEqual([]);
    });
  });

  describe('date range validation', () => {
    it('should allow adding budgets with non-overlapping date ranges', () => {
      const { result } = renderHook(() => useBudgetStore());
      const budget1: Budget = {
        id: '1',
        transactionTypeId: 'tt1',
        amount: 500,
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const budget2: Budget = {
        id: '2',
        transactionTypeId: 'tt1',
        amount: 600,
        period: 'monthly',
        startDate: '2026-07-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      act(() => {
        result.current.addBudget(budget1);
      });

      act(() => {
        result.current.addBudget(budget2);
      });

      expect(result.current.budgets).toHaveLength(2);
    });

    it('should prevent adding budgets with overlapping date ranges', () => {
      const { result } = renderHook(() => useBudgetStore());
      const budget1: Budget = {
        id: '1',
        transactionTypeId: 'tt1',
        amount: 500,
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const budget2: Budget = {
        id: '2',
        transactionTypeId: 'tt1',
        amount: 600,
        period: 'monthly',
        startDate: '2026-06-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      act(() => {
        result.current.addBudget(budget1);
      });

      expect(() => {
        act(() => {
          result.current.addBudget(budget2);
        });
      }).toThrow('A budget with overlapping dates already exists for this transaction type');
    });

    it('should allow budgets with same date range for different transaction types', () => {
      const { result } = renderHook(() => useBudgetStore());
      const budget1: Budget = {
        id: '1',
        transactionTypeId: 'tt1',
        amount: 500,
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const budget2: Budget = {
        id: '2',
        transactionTypeId: 'tt2',
        amount: 600,
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      act(() => {
        result.current.addBudget(budget1);
      });

      act(() => {
        result.current.addBudget(budget2);
      });

      expect(result.current.budgets).toHaveLength(2);
    });

    it('should validate date ranges when updating budgets', () => {
      const { result } = renderHook(() => useBudgetStore());
      const budget1: Budget = {
        id: '1',
        transactionTypeId: 'tt1',
        amount: 500,
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const budget2: Budget = {
        id: '2',
        transactionTypeId: 'tt1',
        amount: 600,
        period: 'monthly',
        startDate: '2026-07-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      act(() => {
        result.current.addBudget(budget1);
        result.current.addBudget(budget2);
      });

      // Try to update budget2 to overlap with budget1
      expect(() => {
        act(() => {
          result.current.updateBudget('2', { startDate: '2026-06-01' });
        });
      }).toThrow('A budget with overlapping dates already exists for this transaction type');
    });

    it('should allow updating budget without changing dates', () => {
      const { result } = renderHook(() => useBudgetStore());
      const budget: Budget = {
        id: '1',
        transactionTypeId: 'tt1',
        amount: 500,
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      act(() => {
        result.current.addBudget(budget);
      });

      act(() => {
        result.current.updateBudget('1', { amount: 600 });
      });

      const updated = result.current.budgets.find((b) => b.id === '1');
      expect(updated?.amount).toBe(600);
    });
  });
});
