import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
} from '@mui/icons-material';
import { Card, CardContent, CardActions, Typography, IconButton, Box, Chip } from '@mui/material';
import React from 'react';
import type { TransactionType, Category } from '@/types/models';

interface TransactionTypeCardProps {
  transactionType: TransactionType;
  category?: Category;
  onEdit: (transactionType: TransactionType) => void;
  onDelete: (transactionType: TransactionType) => void;
  onArchive: (transactionType: TransactionType) => void;
}

export const TransactionTypeCard: React.FC<TransactionTypeCardProps> = ({
  transactionType,
  category,
  onEdit,
  onDelete,
  onArchive,
}) => {
  const handleEdit = () => {
    onEdit(transactionType);
  };

  const handleDelete = () => {
    onDelete(transactionType);
  };

  const handleArchive = () => {
    onArchive(transactionType);
  };

  const getGroupColor = (group?: string) => {
    switch (group) {
      case 'income':
        return 'success';
      case 'expense':
        return 'error';
      case 'transfer':
        return 'info';
      case 'asset_purchase':
        return 'primary';
      case 'asset_sale':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ opacity: transactionType.isActive === false ? 0.6 : 1 }}>
      <CardContent>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" component="h3">
              {transactionType.name}
            </Typography>
            {transactionType.isActive === false && (
              <Chip label="Archived" size="small" color="default" variant="outlined" />
            )}
          </Box>
          <Chip
            label={transactionType.group.toUpperCase().replace('_', ' ')}
            size="small"
            color={getGroupColor(transactionType.group)}
          />
        </Box>
        {category && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Category: {category.name}
          </Typography>
        )}
        {transactionType.description && (
          <Typography variant="body2" color="text.secondary">
            {transactionType.description}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <IconButton size="small" onClick={handleEdit} aria-label={`Edit ${transactionType.name}`}>
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleArchive}
          aria-label={
            transactionType.isActive === false
              ? `Unarchive ${transactionType.name}`
              : `Archive ${transactionType.name}`
          }
          color={transactionType.isActive === false ? 'success' : 'default'}
        >
          {transactionType.isActive === false ? <UnarchiveIcon /> : <ArchiveIcon />}
        </IconButton>
        <IconButton
          size="small"
          onClick={handleDelete}
          aria-label={`Delete ${transactionType.name}`}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};
