import { useState, useCallback } from 'react';
import { db } from '../../db/database';
import type { ManualAsset } from '../../types/models';
import { useSyncService } from '../../contexts/SyncProvider';

export function useAssetMutations() {
  const syncService = useSyncService();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addAsset = useCallback(
    async (asset: ManualAsset) => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date().toISOString();
        const data = {
          ...asset,
          isDeleted: false,
          createdAt: asset.createdAt || now,
          updatedAt: now,
        };
        const id = (await db.manualAssets.add(data)) as string;
        syncService.debouncedSync();
        return id;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add asset');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  const updateAsset = useCallback(
    async (id: string, updates: Partial<ManualAsset>) => {
      setIsLoading(true);
      setError(null);
      try {
        await db.manualAssets.update(id, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update asset');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  const deleteAsset = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        // Soft delete: mark as deleted instead of removing
        await db.manualAssets.update(id, {
          isDeleted: true,
          updatedAt: new Date().toISOString(),
        });
        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete asset');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

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

        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update asset value');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
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
