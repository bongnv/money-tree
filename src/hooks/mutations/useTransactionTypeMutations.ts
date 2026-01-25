import { useState, useCallback } from 'react';
import { db } from '../../db/database';
import type { TransactionType } from '../../types/models';
import { useSyncService } from '../../contexts/SyncProvider';

export function useTransactionTypeMutations() {
  const syncService = useSyncService();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addTransactionType = useCallback(
    async (transactionType: TransactionType) => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date().toISOString();
        const data = {
          ...transactionType,
          createdAt: transactionType.createdAt || now,
          updatedAt: now,
        };
        const id = (await db.transactionTypes.add(data)) as string;
        syncService.debouncedSync();
        return id;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add transaction type');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  const updateTransactionType = useCallback(
    async (id: string, updates: Partial<TransactionType>) => {
      setIsLoading(true);
      setError(null);
      try {
        await db.transactionTypes.update(id, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update transaction type');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteTransactionType = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await db.transactionTypes.delete(id);
        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete transaction type');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  const archiveTransactionType = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await db.transactionTypes.update(id, {
          isActive: false,
          updatedAt: new Date().toISOString(),
        });
        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to archive transaction type');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  const unarchiveTransactionType = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await db.transactionTypes.update(id, {
          isActive: true,
          updatedAt: new Date().toISOString(),
        });
        syncService.debouncedSync();
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to unarchive transaction type');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  return {
    addTransactionType,
    updateTransactionType,
    deleteTransactionType,
    archiveTransactionType,
    unarchiveTransactionType,
    isLoading,
    error,
  };
}
