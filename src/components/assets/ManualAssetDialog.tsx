import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Alert } from '@mui/material';
import { ManualAssetForm } from './ManualAssetForm';
import type { ManualAsset } from '@/types/models';
import { formatCurrency } from '@/utils/currency.utils';
import { formatDate, getTodayDate } from '@/utils/date.utils';
import { getAssetCurrentValue } from '@/utils/asset.utils';
import { CurrencyCode } from '@/types/enums';

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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [previousValue, setPreviousValue] = useState<{ value: number; date: string } | null>(null);

  // Sync internal state with mode prop when it changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowSuccessMessage(false);

    setPreviousValue(null);
  }, [mode, open]);

  // Derive isUpdateMode from props instead of state
  const isUpdateMode = mode === 'update-value';

  const handleClose = () => {
    setShowSuccessMessage(false);
    setPreviousValue(null);
    onClose();
  };

  const handleSuccess = async () => {
    if (asset && isUpdateMode) {
      // Update value workflow: show success message
      const currentValue = getAssetCurrentValue(asset);
      const latestEntry = [...asset.valueHistory].sort((a, b) => b.date.localeCompare(a.date))[0];
      setPreviousValue({ value: currentValue, date: latestEntry.date });
      setShowSuccessMessage(true);
      // Auto-close after showing success message
      setTimeout(() => {
        handleClose();
      }, 2000);
    } else {
      // Regular edit or create workflow - just close
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
            {formatCurrency(previousValue.value, asset?.currencyCode || CurrencyCode.USD)} on{' '}
            {formatDate(previousValue.date)}) saved to history.
          </Alert>
        )}

        {asset &&
          isUpdateMode &&
          (() => {
            const currentValue = getAssetCurrentValue(asset);
            const latestEntry = [...asset.valueHistory].sort((a, b) =>
              b.date.localeCompare(a.date)
            )[0];
            return (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Current Value
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(currentValue, asset.currencyCode)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  As of {formatDate(latestEntry.date)}
                </Typography>
                {latestEntry.notes && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Notes: {latestEntry.notes}
                  </Typography>
                )}
              </Box>
            );
          })()}

        {!isUpdateMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Tip:</strong> You can also update asset values by creating Asset Transactions
              in the Transactions page. These will automatically adjust the asset value and maintain
              a link to the transaction.
            </Typography>
          </Alert>
        )}

        <ManualAssetForm
          asset={
            isUpdateMode
              ? {
                  ...asset!,
                  valueHistory: [{ value: 0, date: getTodayDate(), notes: '' }],
                }
              : asset
          }
          onSubmit={handleSuccess}
          onCancel={handleClose}
          updateValueOnly={isUpdateMode}
        />
      </DialogContent>
    </Dialog>
  );
};
