import { useState, useCallback } from 'react';
import { db } from '../../db/database';
import type { Category } from '../../types/models';
import { getCloudSyncService } from '../../services/cloudSync.service';

export function useCategoryMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addCategory = useCallback(async (category: Category) => {
    setIsLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const data = {
        ...category,
        createdAt: category.createdAt || now,
        updatedAt: now,
      };
      const id = (await db.categories.add(data)) as string;
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add category');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    setIsLoading(true);
    setError(null);
    try {
      await db.categories.update(id, {
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
      const error = err instanceof Error ? err : new Error('Failed to update category');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await db.categories.delete(id);
      try {
        const syncService = getCloudSyncService();
        syncService.throttledSync();
      } catch (e) {
        // Sync service not initialized yet, skip sync
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete category');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addCategory,
    updateCategory,
    deleteCategory,
    isLoading,
    error,
  };
}
