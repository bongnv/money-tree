import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import type { TransactionType, Category } from '../../types/models';
import { TransactionTypeForm } from './TransactionTypeForm';

interface TransactionTypeDialogProps {
  open: boolean;
  transactionType?: TransactionType;
  categories: Category[];
  onClose: () => void;
  onSubmit: (transactionType: Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const TransactionTypeDialog: React.FC<TransactionTypeDialogProps> = ({
  open,
  transactionType,
  categories,
  onClose,
  onSubmit,
}) => {
  const handleSubmit = (
    transactionTypeData: Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    onSubmit(transactionTypeData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {transactionType ? 'Edit Transaction Type' : 'Add Transaction Type'}
      </DialogTitle>
      <DialogContent>
        <TransactionTypeForm
          transactionType={transactionType}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
