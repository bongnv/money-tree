import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { ManualAssetForm } from './ManualAssetForm';
import { useAssetStore } from '../../stores/useAssetStore';
import type { ManualAsset } from '../../types/models';

interface ManualAssetDialogProps {
  open: boolean;
  asset?: ManualAsset;
  onClose: () => void;
}

export const ManualAssetDialog: React.FC<ManualAssetDialogProps> = ({
  open,
  asset,
  onClose,
}) => {
  const { addManualAsset, updateManualAsset } = useAssetStore();

  const handleSubmit = (assetData: Omit<ManualAsset, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (asset) {
      updateManualAsset(asset.id, assetData);
    } else {
      const now = new Date().toISOString();
      const newAsset: ManualAsset = {
        ...assetData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      addManualAsset(newAsset);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {asset ? 'Edit Asset' : 'Add Manual Asset'}
      </DialogTitle>
      <DialogContent>
        <ManualAssetForm
          asset={asset}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
