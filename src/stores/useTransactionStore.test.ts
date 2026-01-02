import { renderHook, act } from '@testing-library/react';
import { useTransactionStore } from './useTransactionStore';
import { useAppStore } from './useAppStore';
import type { Transaction } from '../types/models';

const mockTransaction: Transaction = {
  id: 'txn-1',
  date: '2024-03-15T00:00:00.000Z',
  description: 'Test Transaction',
  amount: 100,
  transactionTypeId: 'type-1',
  fromAccountId: 'acc-1',
  toAccountId: undefined,
  createdAt: '2024-03-15T10:00:00.000Z',
  updatedAt: '2024-03-15T10:00:00.000Z',
};

const mockTransaction2: Transaction = {
  id: 'txn-2',
  date: '2024-03-20T00:00:00.000Z',
  description: 'Another Transaction',
  amount: 200,
  transactionTypeId: 'type-2',
  fromAccountId: undefined,
  toAccountId: 'acc-2',
  createdAt: '2024-03-20T10:00:00.000Z',
  updatedAt: '2024-03-20T10:00:00.000Z',
};

describe('useTransactionStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useTransactionStore());
    act(() => {
      result.current.resetTransactions();
    });
    const appStore = renderHook(() => useAppStore());
    act(() => {
      appStore.result.current.setUnsavedChanges(false);
    });
  });

  describe('setTransactions', () => {
    it('should set transactions', () => {
      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.setTransactions([mockTransaction, mockTransaction2]);
      });

      expect(result.current.transactions).toHaveLength(2);
      expect(result.current.transactions[0]).toEqual(mockTransaction);
      expect(result.current.transactions[1]).toEqual(mockTransaction2);
    });
  });

  describe('addTransaction', () => {
    it('should add a transaction', () => {
      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
      });

      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0]).toEqual(mockTransaction);
    });

    it('should mark as unsaved changes', () => {
      const { result } = renderHook(() => useTransactionStore());
      const appStore = renderHook(() => useAppStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
      });

      expect(appStore.result.current.hasUnsavedChanges).toBe(true);
    });
  });

  describe('updateTransaction', () => {
    it('should update a transaction', () => {
      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
      });

      act(() => {
        result.current.updateTransaction('txn-1', {
          description: 'Updated Transaction',
          amount: 150,
        });
      });

      const updated = result.current.transactions[0];
      expect(updated.description).toBe('Updated Transaction');
      expect(updated.amount).toBe(150);
      expect(updated.updatedAt).not.toBe(mockTransaction.updatedAt);
    });

    it('should not update non-existent transaction', () => {
      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
      });

      act(() => {
        result.current.updateTransaction('non-existent', { description: 'Test' });
      });

      expect(result.current.transactions[0]).toEqual(mockTransaction);
    });

    it('should mark as unsaved changes', () => {
      const { result } = renderHook(() => useTransactionStore());
      const appStore = renderHook(() => useAppStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
        appStore.result.current.setUnsavedChanges(false);
      });

      act(() => {
        result.current.updateTransaction('txn-1', { description: 'Updated' });
      });

      expect(appStore.result.current.hasUnsavedChanges).toBe(true);
    });
  });

  describe('deleteTransaction', () => {
    it('should delete a transaction', () => {
      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
        result.current.addTransaction(mockTransaction2);
      });

      expect(result.current.transactions).toHaveLength(2);

      act(() => {
        result.current.deleteTransaction('txn-1');
      });

      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0].id).toBe('txn-2');
    });

    it('should mark as unsaved changes', () => {
      const { result } = renderHook(() => useTransactionStore());
      const appStore = renderHook(() => useAppStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
        appStore.result.current.setUnsavedChanges(false);
      });

      act(() => {
        result.current.deleteTransaction('txn-1');
      });

      expect(appStore.result.current.hasUnsavedChanges).toBe(true);
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction by id', () => {
      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
        result.current.addTransaction(mockTransaction2);
      });

      const transaction = result.current.getTransactionById('txn-1');
      expect(transaction).toEqual(mockTransaction);
    });

    it('should return undefined for non-existent id', () => {
      const { result } = renderHook(() => useTransactionStore());

      const transaction = result.current.getTransactionById('non-existent');
      expect(transaction).toBeUndefined();
    });
  });

  describe('getTransactionsByAccount', () => {
    it('should return transactions by fromAccountId', () => {
      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
        result.current.addTransaction(mockTransaction2);
      });

      const transactions = result.current.getTransactionsByAccount('acc-1');
      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe('txn-1');
    });

    it('should return transactions by toAccountId', () => {
      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
        result.current.addTransaction(mockTransaction2);
      });

      const transactions = result.current.getTransactionsByAccount('acc-2');
      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe('txn-2');
    });

    it('should return empty array for account with no transactions', () => {
      const { result } = renderHook(() => useTransactionStore());

      const transactions = result.current.getTransactionsByAccount('acc-3');
      expect(transactions).toHaveLength(0);
    });
  });

  describe('getTransactionsByType', () => {
    it('should return transactions by transaction type', () => {
      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
        result.current.addTransaction(mockTransaction2);
      });

      const transactions = result.current.getTransactionsByType('type-1');
      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe('txn-1');
    });

    it('should return empty array for type with no transactions', () => {
      const { result } = renderHook(() => useTransactionStore());

      const transactions = result.current.getTransactionsByType('type-3');
      expect(transactions).toHaveLength(0);
    });
  });

  describe('getTransactionsByDateRange', () => {
    it('should return transactions within date range', () => {
      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
        result.current.addTransaction(mockTransaction2);
      });

      const transactions = result.current.getTransactionsByDateRange(
        '2024-03-10T00:00:00.000Z',
        '2024-03-18T00:00:00.000Z'
      );

      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe('txn-1');
    });

    it('should return all transactions when range is wide', () => {
      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
        result.current.addTransaction(mockTransaction2);
      });

      const transactions = result.current.getTransactionsByDateRange(
        '2024-01-01T00:00:00.000Z',
        '2024-12-31T00:00:00.000Z'
      );

      expect(transactions).toHaveLength(2);
    });

    it('should return empty array when no transactions in range', () => {
      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
      });

      const transactions = result.current.getTransactionsByDateRange(
        '2024-04-01T00:00:00.000Z',
        '2024-04-30T00:00:00.000Z'
      );

      expect(transactions).toHaveLength(0);
    });
  });

  describe('resetTransactions', () => {
    it('should clear all transactions', () => {
      const { result } = renderHook(() => useTransactionStore());

      act(() => {
        result.current.addTransaction(mockTransaction);
        result.current.addTransaction(mockTransaction2);
      });

      expect(result.current.transactions).toHaveLength(2);

      act(() => {
        result.current.resetTransactions();
      });

      expect(result.current.transactions).toHaveLength(0);
    });
  });
});
