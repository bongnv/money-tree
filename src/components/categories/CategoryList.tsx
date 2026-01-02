import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import type { Category, TransactionType } from '../../types/models';
import { CategoryCard } from './CategoryCard';

interface CategoryListProps {
  categories: Category[];
  transactionTypes: TransactionType[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  transactionTypes,
  onEdit,
  onDelete,
}) => {
  const getTransactionTypeCount = (categoryId: string) => {
    return transactionTypes.filter((tt) => tt.categoryId === categoryId).length;
  };

  if (categories.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No categories yet. Create your first category to organize transactions.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {categories.map((category) => (
        <Grid item xs={12} sm={6} md={4} key={category.id}>
          <CategoryCard
            category={category}
            transactionTypeCount={getTransactionTypeCount(category.id)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Grid>
      ))}
    </Grid>
  );
};
