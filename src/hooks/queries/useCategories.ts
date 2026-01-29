import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { Category } from '../../types/models';

// Get all non-deleted categories
export function useCategories(): Category[] | undefined {
  return useLiveQuery(() =>
    db.categories.toArray().then((items) => items.filter((c) => !c.isDeleted))
  );
}
