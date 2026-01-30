import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { ManualAsset } from '../../types/models';
import { ManualAssetList } from './ManualAssetList';
import { ManualAssetDialog } from './ManualAssetDialog';
import { useAssets } from '../../hooks/useAssets';
import { useAssetService } from '@/hooks/useServices';
import { useAssetDialog } from '@/hooks/assets/useAssetDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export const ManualAssetsPage: React.FC = () => {
  const manualAssets = useAssets();
  const assetService = useAssetService();
  const assetDialog = useAssetDialog();
  const [deleteAsset, setDeleteAsset] = useState<ManualAsset | null>(null);

  const handleOpenDialog = () => {
    assetDialog.openCreate();
  };

  const handleEdit = (asset: ManualAsset) => {
    assetDialog.openEdit(asset);
  };

  const handleUpdateValue = (asset: ManualAsset) => {
    assetDialog.openView(asset);
  };

  const handleDelete = (asset: ManualAsset) => {
    setDeleteAsset(asset);
  };

  const handleConfirmDelete = async () => {
    if (deleteAsset?.id) {
      await assetService.delete(deleteAsset.id);
      setDeleteAsset(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manual Assets
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          Add Asset
        </Button>
      </Box>

      <ManualAssetList
        assets={manualAssets || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdateValue={handleUpdateValue}
      />

      <ManualAssetDialog
        open={assetDialog.isOpen}
        asset={assetDialog.selectedItem || undefined}
        onClose={assetDialog.close}
        mode={assetDialog.mode === 'view' ? 'update-value' : assetDialog.mode}
      />

      <ConfirmDialog
        open={!!deleteAsset}
        title="Delete Asset"
        message={`Are you sure you want to delete "${deleteAsset?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteAsset(null)}
        confirmText="Delete"
        severity="error"
      />
    </Box>
  );
};
