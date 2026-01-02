import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import type { Transaction, Account, TransactionType, Category } from '../../types/models';
import { TransactionForm } from './TransactionForm';

interface TransactionDialogProps {
  open: boolean;
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  transactionTypes: TransactionType[];
  onClose: () => void;
  onSubmit: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  open,
  transaction,
  accounts,
  categories,
  transactionTypes,
  onClose,
  onSubmit,
}) => {
  const handleSubmit = (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    onSubmit(transactionData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{transaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
      <DialogContent>
        <TransactionForm
          transaction={transaction}
          accounts={accounts}
          categories={categories}
          transactionTypes={transactionTypes}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
