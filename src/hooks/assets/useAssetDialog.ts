import { useDialogState } from '../primitives/useDialogState';
import type { ManualAsset } from '@/types/models';
import { useState, useCallback } from 'react';

type AssetDialogMode = 'create' | 'edit' | 'update-value';

/**
 * Domain hook for asset dialog management
 * Extends useDialogState with asset-specific modes (create/edit/update-value)
 */
export function useAssetDialog() {
  const baseDialog = useDialogState<ManualAsset>();
  const [assetMode, setAssetMode] = useState<AssetDialogMode>('create');

  const openCreate = useCallback(() => {
    setAssetMode('create');
    baseDialog.openCreate();
  }, [baseDialog]);

  const openEdit = useCallback(
    (asset: ManualAsset) => {
      setAssetMode('edit');
      baseDialog.openEdit(asset);
    },
    [baseDialog]
  );

  const openUpdateValue = useCallback(
    (asset: ManualAsset) => {
      setAssetMode('update-value');
      baseDialog.openEdit(asset);
    },
    [baseDialog]
  );

  return {
    ...baseDialog,
    assetMode,
    openCreate,
    openEdit,
    openUpdateValue,
  };
}
