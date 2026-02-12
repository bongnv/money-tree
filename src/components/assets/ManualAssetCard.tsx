import React from 'react';
import { Box, Paper, Typography, IconButton, Chip, Button } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import type { ManualAsset } from '@/types/models';
import { AssetType } from '@/types/enums';
import { formatCurrency } from '@/utils/currency.utils';
import { formatDate } from '@/utils/date.utils';
import { getAssetCurrentValue } from '@/utils/asset.utils';

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
  const currentValue = getAssetCurrentValue(asset);
  const latestEntry = [...asset.valueHistory].sort((a, b) => b.date.localeCompare(a.date))[0];
  const assetTypeLabels: Record<AssetType, string> = {
    [AssetType.REAL_ESTATE]: 'Real Estate',
    [AssetType.SUPERANNUATION]: 'Superannuation',
    [AssetType.STOCKS_AND_SHARES]: 'Stocks & Shares',
    [AssetType.LIABILITY]: 'Liability',
    [AssetType.OTHER]: 'Other',
  };

  const assetTypeColors: Record<
    AssetType,
    'primary' | 'success' | 'info' | 'warning' | 'error' | 'default'
  > = {
    [AssetType.REAL_ESTATE]: 'primary',
    [AssetType.SUPERANNUATION]: 'info',
    [AssetType.STOCKS_AND_SHARES]: 'success',
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
        {formatCurrency(currentValue, asset.currencyCode)}
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        As of {formatDate(latestEntry.date)}
      </Typography>

      {latestEntry.notes && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {latestEntry.notes}
        </Typography>
      )}
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
    </Paper>
  );
};
