import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Chip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { Category } from '../../types/models';

interface CategoryCardProps {
  category: Category;
  transactionTypeCount: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  transactionTypeCount,
  onEdit,
  onDelete,
}) => {
  const handleEdit = () => {
    onEdit(category);
  };

  const handleDelete = () => {
    onDelete(category);
  };

  const getGroupColor = (group: string) => {
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h3">
            {category.name}
          </Typography>
          <Chip
            label={category.group.toUpperCase()}
            size="small"
            color={getGroupColor(category.group)}
          />
        </Box>
        {category.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {category.description}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {transactionTypeCount} transaction {transactionTypeCount === 1 ? 'type' : 'types'}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <IconButton
          size="small"
          onClick={handleEdit}
          aria-label={`Edit ${category.name}`}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleDelete}
          aria-label={`Delete ${category.name}`}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};
