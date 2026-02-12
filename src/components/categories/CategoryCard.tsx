import React from 'react';
import { Card, CardContent, CardActions, Typography, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { Category } from '@/types/models';

interface CategoryCardProps {
  category: Category;
  transactionTypeCount: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onClick?: (category: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  transactionTypeCount,
  onEdit,
  onDelete,
  onClick,
}) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(category);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(category);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(category);
    }
  };

  return (
    <Card
      onClick={handleClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick
          ? {
              boxShadow: 3,
            }
          : {},
      }}
    >
      <CardContent>
        <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
          {category.name}
        </Typography>
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
        <IconButton size="small" onClick={handleEdit} aria-label={`Edit ${category.name}`}>
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
