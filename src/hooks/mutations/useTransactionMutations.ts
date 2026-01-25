import { useState, useCallback } from 'react';
import { db } from '../../db/database';
import type { Transaction } from '../../types/models';
import { useSyncService } from '../../contexts/SyncProvider';

export function useTransactionMutations() {
  const syncService = useSyncService();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addTransaction = useCallback(
    async (transaction: Transaction) => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date().toISOString();
        const data = {
          ...transaction,
          createdAt: transaction.createdAt || now,
          updatedAt: now,
        };
        const id = await db.transactions.add(data);
        // Trigger debounced sync
        syncService.debouncedSync();
        return id as string;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add transaction');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      setIsLoading(true);
      setError(null);
      try {
        await db.transactions.update(id, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        // Trigger debounced sync
        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update transaction');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await db.transactions.delete(id);
        // Trigger debounced sync
        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete transaction');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    isLoading,
    error,
  };
}
