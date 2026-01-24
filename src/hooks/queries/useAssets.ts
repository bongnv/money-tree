import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { ManualAsset } from '../../types/models';

// Get all assets
export function useAssets(): ManualAsset[] | undefined {
  return useLiveQuery(() => db.manualAssets.toArray());
}
