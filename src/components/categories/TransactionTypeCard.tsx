import React from 'react';
import { Card, CardContent, CardActions, Typography, IconButton, Box, Chip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { TransactionType, Category } from '../../types/models';

interface TransactionTypeCardProps {
  transactionType: TransactionType;
  category?: Category;
  onEdit: (transactionType: TransactionType) => void;
  onDelete: (transactionType: TransactionType) => void;
}

export const TransactionTypeCard: React.FC<TransactionTypeCardProps> = ({
  transactionType,
  category,
  onEdit,
  onDelete,
}) => {
  const handleEdit = () => {
    onEdit(transactionType);
  };

  const handleDelete = () => {
    onDelete(transactionType);
  };

  const getGroupColor = (group?: string) => {
    switch (group) {
      case 'income':
        return 'success';
      case 'expense':
        return 'error';
      case 'transfer':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Typography variant="h6" component="h3">
            {transactionType.name}
          </Typography>
          {category && (
            <Chip label={category.name} size="small" color={getGroupColor(category.group)} />
          )}
        </Box>
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
