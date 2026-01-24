import { useState, useCallback } from 'react';
import { db } from '../../db/database';
import type { ExchangeRate } from '../../types/models';
import { getCloudSyncService } from '../../services/cloudSync.service';

export function useExchangeRateMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addExchangeRate = useCallback(async (exchangeRate: ExchangeRate) => {
    setIsLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const data = {
        ...exchangeRate,
        createdAt: exchangeRate.createdAt || now,
      };
      const id = (await db.exchangeRates.add(data)) as string;
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add exchange rate');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateExchangeRate = useCallback(async (id: string, updates: Partial<ExchangeRate>) => {
    setIsLoading(true);
    setError(null);
    try {
      await db.exchangeRates.update(id, updates);
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update exchange rate');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteExchangeRate = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await db.exchangeRates.delete(id);
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete exchange rate');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addExchangeRate,
    updateExchangeRate,
    deleteExchangeRate,
    isLoading,
    error,
  };
}
