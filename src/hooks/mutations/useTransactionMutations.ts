import { useState, useCallback } from 'react';
import { db } from '../../db/database';
import type { Transaction } from '../../types/models';
import { getCloudSyncService } from '../../services/cloudSync.service';

export function useTransactionMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addTransaction = useCallback(async (transaction: Transaction) => {
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
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
      return id as string;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add transaction');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    setIsLoading(true);
    setError(null);
    try {
      await db.transactions.update(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      // Trigger debounced sync
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update transaction');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await db.transactions.delete(id);
      // Trigger debounced sync
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete transaction');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    isLoading,
    error,
  };
}
