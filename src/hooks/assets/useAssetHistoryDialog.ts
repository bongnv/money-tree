import { useDialogState } from '../primitives/useDialogState';
import type { ManualAsset } from '@/types/models';

/**
 * Domain hook for asset history dialog management
 * Wraps useDialogState primitive for viewing asset value history
 */
export function useAssetHistoryDialog() {
  return useDialogState<ManualAsset>();
}
