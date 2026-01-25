import { useState, useCallback } from 'react';
import { db } from '../../db/database';
import type { ExchangeRate } from '../../types/models';
import { useSyncService } from '../../contexts/SyncProvider';

export function useExchangeRateMutations() {
  const syncService = useSyncService();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addExchangeRate = useCallback(
    async (exchangeRate: ExchangeRate) => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date().toISOString();
        const data = {
          ...exchangeRate,
          createdAt: exchangeRate.createdAt || now,
        };
        const id = (await db.exchangeRates.add(data)) as string;
        syncService.debouncedSync();
        return id;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add exchange rate');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  const updateExchangeRate = useCallback(
    async (id: string, updates: Partial<ExchangeRate>) => {
      setIsLoading(true);
      setError(null);
      try {
        await db.exchangeRates.update(id, updates);
        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update exchange rate');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  const deleteExchangeRate = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await db.exchangeRates.delete(id);
        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete exchange rate');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  return {
    addExchangeRate,
    updateExchangeRate,
    deleteExchangeRate,
    isLoading,
    error,
  };
}
