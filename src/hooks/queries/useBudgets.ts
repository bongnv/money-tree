import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { Budget } from '../../types/models';

// Get all non-deleted budgets
export function useBudgets(): Budget[] | undefined {
  return useLiveQuery(() =>
    db.budgets.toArray().then((items) => items.filter((b) => !b.isDeleted))
  );
}
