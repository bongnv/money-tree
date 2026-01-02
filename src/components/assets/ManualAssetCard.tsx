import React from 'react';
import { Box, Paper, Typography, IconButton, Chip, Button } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import type { ManualAsset } from '../../types/models';
import { AssetType } from '../../types/enums';
import { formatCurrency } from '../../utils/currency.utils';
import { formatDate } from '../../utils/date.utils';

interface ManualAssetCardProps {
  asset: ManualAsset;
  onEdit: (asset: ManualAsset) => void;
  onDelete: (asset: ManualAsset) => void;
  onUpdateValue?: (asset: ManualAsset) => void;
}

export const ManualAssetCard: React.FC<ManualAssetCardProps> = ({
  asset,
  onEdit,
  onDelete,
  onUpdateValue,
}) => {
  const assetTypeLabels: Record<AssetType, string> = {
    [AssetType.REAL_ESTATE]: 'Real Estate',
    [AssetType.SUPERANNUATION]: 'Superannuation',
    [AssetType.INVESTMENT]: 'Investment',
    [AssetType.LIABILITY]: 'Liability',
    [AssetType.OTHER]: 'Other',
  };

  const assetTypeColors: Record<
    AssetType,
    'primary' | 'success' | 'info' | 'warning' | 'error' | 'default'
  > = {
    [AssetType.REAL_ESTATE]: 'primary',
    [AssetType.SUPERANNUATION]: 'info',
    [AssetType.INVESTMENT]: 'success',
    [AssetType.LIABILITY]: 'error',
    [AssetType.OTHER]: 'default',
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            {asset.name}
          </Typography>
          <Chip
            label={assetTypeLabels[asset.type]}
            color={assetTypeColors[asset.type]}
            size="small"
            sx={{ mb: 1 }}
          />
        </Box>
        <Box>
          <IconButton size="small" onClick={() => onEdit(asset)} aria-label="Edit asset">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(asset)}
            aria-label="Delete asset"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Typography variant="h5" color="primary" gutterBottom>
        {formatCurrency(asset.value, asset.currencyId)}
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        As of {formatDate(asset.date)}
      </Typography>


      {onUpdateValue && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TrendingUpIcon />}
            onClick={() => onUpdateValue(asset)}
            fullWidth
          >
            Update Value
          </Button>
        </Box>
      )}
      {asset.notes && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {asset.notes}
        </Typography>
      )}
    </Paper>
  );
};
