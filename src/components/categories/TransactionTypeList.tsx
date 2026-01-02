import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import type { TransactionType, Category } from '../../types/models';
import { TransactionTypeCard } from './TransactionTypeCard';

interface TransactionTypeListProps {
  transactionTypes: TransactionType[];
  categories: Category[];
  onEdit: (transactionType: TransactionType) => void;
  onDelete: (transactionType: TransactionType) => void;
}

export const TransactionTypeList: React.FC<TransactionTypeListProps> = ({
  transactionTypes,
  categories,
  onEdit,
  onDelete,
}) => {
  const getCategoryById = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  if (transactionTypes.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No transaction types yet. Create your first transaction type.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {transactionTypes.map((transactionType) => (
        <Grid item xs={12} sm={6} md={4} key={transactionType.id}>
          <TransactionTypeCard
            transactionType={transactionType}
            category={getCategoryById(transactionType.categoryId)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Grid>
      ))}
    </Grid>
  );
};
