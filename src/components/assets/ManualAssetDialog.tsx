import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { ManualAssetForm } from './ManualAssetForm';
import { useAssetStore } from '../../stores/useAssetStore';
import type { ManualAsset } from '../../types/models';
import { formatCurrency } from '../../utils/currency.utils';
import { formatDate } from '../../utils/date.utils';

interface ManualAssetDialogProps {
  open: boolean;
  asset?: ManualAsset;
  onClose: () => void;
  mode?: 'create' | 'edit' | 'update-value';
}

export const ManualAssetDialog: React.FC<ManualAssetDialogProps> = ({
  open,
  asset,
  onClose,
  mode = 'create',
}) => {
  const { addManualAsset, updateManualAsset, updateAssetValue } = useAssetStore();
  const [isUpdateMode, setIsUpdateMode] = useState(mode === 'update-value');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [previousValue, setPreviousValue] = useState<{ value: number; date: string } | null>(null);

  // Sync internal state with mode prop when it changes
  useEffect(() => {
    setIsUpdateMode(mode === 'update-value');
    setShowSuccessMessage(false);
    setPreviousValue(null);
  }, [mode, open]);

  const handleClose = () => {
    setIsUpdateMode(mode === 'update-value');
    setShowSuccessMessage(false);
    setPreviousValue(null);
    onClose();
  };

  const handleSubmit = (assetData: Omit<ManualAsset, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (asset && isUpdateMode) {
      // Update value workflow: move current value to history
      setPreviousValue({ value: asset.value, date: asset.date });
      updateAssetValue(asset.id, assetData.value, assetData.date, assetData.notes);
      setShowSuccessMessage(true);
      // Auto-close after showing success message
      setTimeout(() => {
        handleClose();
      }, 2000);
    } else if (asset) {
      // Regular edit workflow
      updateManualAsset(asset.id, assetData);
      handleClose();
    } else {
      // Create new asset
      const now = new Date().toISOString();
      const newAsset: ManualAsset = {
        ...assetData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      addManualAsset(newAsset);
      handleClose();
    }
  };

  const getDialogTitle = () => {
    if (!asset) return 'Add Manual Asset';
    if (isUpdateMode) return `Update Value - ${asset.name}`;
    return 'Edit Asset';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{getDialogTitle()}</DialogTitle>
      <DialogContent>
        {showSuccessMessage && previousValue && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Value updated. Previous value (
            {formatCurrency(previousValue.value, asset?.currencyId || 'usd')} on{' '}
            {formatDate(previousValue.date)}) saved to history.
          </Alert>
        )}

        {asset && !isUpdateMode && mode !== 'update-value' && (
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isUpdateMode}
                  onChange={(e) => setIsUpdateMode(e.target.checked)}
                />
              }
              label="Update existing value (move current value to history)"
            />
          </Box>
        )}

        {asset && isUpdateMode && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Current Value
            </Typography>
            <Typography variant="h6">{formatCurrency(asset.value, asset.currencyId)}</Typography>
            <Typography variant="body2" color="text.secondary">
              As of {formatDate(asset.date)}
            </Typography>
            {asset.notes && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Notes: {asset.notes}
              </Typography>
            )}
          </Box>
        )}

        <ManualAssetForm
          asset={
            isUpdateMode
              ? { ...asset!, value: 0, date: new Date().toISOString().split('T')[0], notes: '' }
              : asset
          }
          onSubmit={handleSubmit}
          onCancel={handleClose}
          updateValueOnly={isUpdateMode}
        />
      </DialogContent>
    </Dialog>
  );
};
