import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { ManualAsset } from '../../types/models';

// Get all non-deleted assets
export function useAssets(): ManualAsset[] | undefined {
  return useLiveQuery(() =>
    db.manualAssets.toArray().then((items) => items.filter((a) => !a.isDeleted))
  );
}
