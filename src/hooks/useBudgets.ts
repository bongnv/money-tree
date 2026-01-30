/**
 * Custom hooks for Budget data access
 * Uses useLiveQuery for reactive database queries
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { useBudgetService } from './useServices';
import type { Budget } from '../types/models';

/**
 * Get all active budgets
 */
export function useBudgets(): Budget[] {
  const budgetService = useBudgetService();
  return useLiveQuery(() => budgetService.getActive()) ?? [];
}

/**
 * Get budget by ID
 */
export function useBudget(id: string | undefined): Budget | undefined {
  const budgetService = useBudgetService();
  return useLiveQuery(() => {
    if (!id) return undefined;
    return budgetService.getById(id);
  }, [id]);
}
