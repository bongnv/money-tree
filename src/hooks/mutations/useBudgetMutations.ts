import { useState, useCallback } from 'react';
import { db } from '../../db/database';
import type { Budget } from '../../types/models';
import { getCloudSyncService } from '../../services/cloudSync.service';

export function useBudgetMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addBudget = useCallback(async (budget: Budget) => {
    setIsLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const data = {
        ...budget,
        createdAt: budget.createdAt || now,
        updatedAt: now,
      };
      const id = (await db.budgets.add(data)) as string;
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add budget');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateBudget = useCallback(async (id: string, updates: Partial<Budget>) => {
    setIsLoading(true);
    setError(null);
    try {
      await db.budgets.update(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update budget');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteBudget = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await db.budgets.delete(id);
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete budget');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addBudget,
    updateBudget,
    deleteBudget,
    isLoading,
    error,
  };
}
