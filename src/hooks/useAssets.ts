/**
 * Custom hooks for ManualAsset data access
 * Uses useLiveQuery for reactive database queries
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { useAssetService } from './useServices';
import type { ManualAsset } from '../types/models';

/**
 * Get all active assets
 */
export function useAssets(): ManualAsset[] {
  const assetService = useAssetService();
  return useLiveQuery(() => assetService.getActive()) ?? [];
}

/**
 * Get asset by ID
 */
export function useAsset(id: string | undefined): ManualAsset | undefined {
  const assetService = useAssetService();
  return useLiveQuery(() => {
    if (!id) return undefined;
    return assetService.getById(id);
  }, [id]);
}
