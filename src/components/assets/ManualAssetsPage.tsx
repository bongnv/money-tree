import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { ManualAsset } from '../../types/models';
import { useAssetStore } from '../../stores/useAssetStore';
import { ManualAssetList } from './ManualAssetList';
import { ManualAssetDialog } from './ManualAssetDialog';

export const ManualAssetsPage: React.FC = () => {
  const { manualAssets, deleteManualAsset } = useAssetStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<ManualAsset | undefined>();
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'update-value'>('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<ManualAsset | undefined>();

  const handleOpenDialog = () => {
    setSelectedAsset(undefined);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAsset(undefined);
    setDialogMode('create');
  };

  const handleEdit = (asset: ManualAsset) => {
    setSelectedAsset(asset);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleUpdateValue = (asset: ManualAsset) => {
    setSelectedAsset(asset);
    setDialogMode('update-value');
    setDialogOpen(true);
  };

  const handleDelete = (asset: ManualAsset) => {
    setAssetToDelete(asset);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (assetToDelete) {
      deleteManualAsset(assetToDelete.id);
    }
    setDeleteDialogOpen(false);
    setAssetToDelete(undefined);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setAssetToDelete(undefined);
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
        assets={manualAssets}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdateValue={handleUpdateValue}
      />

      <ManualAssetDialog
        open={dialogOpen}
        asset={selectedAsset}
        onClose={handleCloseDialog}
        mode={dialogMode}
      />

      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Asset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{assetToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
