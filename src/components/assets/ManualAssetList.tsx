import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import type { ManualAsset } from '../../types/models';
import { ManualAssetCard } from './ManualAssetCard';

interface ManualAssetListProps {
  assets: ManualAsset[];
  onEdit: (asset: ManualAsset) => void;
  onDelete: (asset: ManualAsset) => void;
}

export const ManualAssetList: React.FC<ManualAssetListProps> = ({
  assets,
  onEdit,
  onDelete,
}) => {
  if (assets.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No manual assets yet. Add your first asset to track your wealth.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {assets.map((asset) => (
        <Grid item xs={12} sm={6} md={4} key={asset.id}>
          <ManualAssetCard asset={asset} onEdit={onEdit} onDelete={onDelete} />
        </Grid>
      ))}
    </Grid>
  );
};
