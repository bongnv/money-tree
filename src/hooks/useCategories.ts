/**
 * Custom hooks for Category data access
 * Uses useLiveQuery for reactive database queries
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { useCategoryService } from '../contexts/ServiceProviders';
import type { Category } from '../types/models';

/**
 * Get all active categories
 */
export function useCategories(): Category[] {
  const categoryService = useCategoryService();
  return useLiveQuery(() => categoryService.getActive()) ?? [];
}

/**
 * Get category by ID
 */
export function useCategory(id: string | undefined): Category | undefined {
  const categoryService = useCategoryService();
  return useLiveQuery(() => {
    if (!id) return undefined;
    return categoryService.getById(id);
  }, [id]);
}
