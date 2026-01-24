import { useState, useCallback } from 'react';
import { db } from '../../db/database';
import type { ManualAsset } from '../../types/models';
import { getCloudSyncService } from '../../services/cloudSync.service';

export function useAssetMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addAsset = useCallback(async (asset: ManualAsset) => {
    setIsLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const data = {
        ...asset,
        createdAt: asset.createdAt || now,
        updatedAt: now,
      };
      const id = (await db.manualAssets.add(data)) as string;
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add asset');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAsset = useCallback(async (id: string, updates: Partial<ManualAsset>) => {
    setIsLoading(true);
    setError(null);
    try {
      await db.manualAssets.update(id, {
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
      const error = err instanceof Error ? err : new Error('Failed to update asset');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAsset = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await db.manualAssets.delete(id);
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete asset');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAssetValue = useCallback(
    async (id: string, value: number, date: string, notes?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const asset = await db.manualAssets.get(id);
        if (!asset) throw new Error('Asset not found');

        const newEntry = { value, date, notes };
        const updatedHistory = [...asset.valueHistory, newEntry];

        await db.manualAssets.update(id, {
          valueHistory: updatedHistory,
          updatedAt: new Date().toISOString(),
        });

        try {
          const syncService = getCloudSyncService();
          syncService.throttledSync();
        } catch (e) {
          // Sync service not initialized yet, skip sync
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update asset value');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    addAsset,
    updateAsset,
    deleteAsset,
    updateAssetValue,
    isLoading,
    error,
  };
}
