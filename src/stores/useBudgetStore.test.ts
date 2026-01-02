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
});
