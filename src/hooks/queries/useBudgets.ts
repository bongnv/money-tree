import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { Budget } from '../../types/models';

// Get all budgets
export function useBudgets(): Budget[] | undefined {
  return useLiveQuery(() => db.budgets.toArray());
}
