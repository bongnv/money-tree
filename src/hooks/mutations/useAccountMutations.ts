import { useState, useCallback } from 'react';
import { db } from '../../db/database';
import type { Account } from '../../types/models';
import { getCloudSyncService } from '../../services/cloudSync.service';

export function useAccountMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addAccount = useCallback(async (account: Account) => {
    setIsLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const data = {
        ...account,
        createdAt: account.createdAt || now,
        updatedAt: now,
      };
      const id = (await db.accounts.add(data)) as string;
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add account');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    setIsLoading(true);
    setError(null);
    try {
      await db.accounts.update(id, {
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
      const error = err instanceof Error ? err : new Error('Failed to update account');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await db.accounts.delete(id);
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete account');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addAccount,
    updateAccount,
    deleteAccount,
    isLoading,
    error,
  };
}
