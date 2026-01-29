import { useState, useCallback } from 'react';
import { db } from '../../db/database';
import type { Category } from '../../types/models';
import { useSyncService } from '../../contexts/SyncProvider';

export function useCategoryMutations() {
  const syncService = useSyncService();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addCategory = useCallback(
    async (category: Category) => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date().toISOString();
        const data = {
          ...category,
          isDeleted: false,
          createdAt: category.createdAt || now,
          updatedAt: now,
        };
        const id = (await db.categories.add(data)) as string;
        syncService.debouncedSync();
        return id;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add category');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>) => {
      setIsLoading(true);
      setError(null);
      try {
        await db.categories.update(id, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update category');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        // Soft delete: mark as deleted instead of removing
        await db.categories.update(id, {
          isDeleted: true,
          updatedAt: new Date().toISOString(),
        });
        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete category');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  return {
    addCategory,
    updateCategory,
    deleteCategory,
    isLoading,
    error,
  };
}
