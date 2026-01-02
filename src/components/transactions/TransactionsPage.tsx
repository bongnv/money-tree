import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { Transaction } from '../../types/models';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { TransactionDialog } from './TransactionDialog';
import { TransactionList } from './TransactionList';

export const TransactionsPage: React.FC = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactionStore();
  const { accounts } = useAccountStore();
  const { categories, transactionTypes } = useCategoryStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | undefined>();

  const handleOpenDialog = () => {
    setSelectedTransaction(undefined);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTransaction(undefined);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDialogOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
    }
    setDeleteDialogOpen(false);
    setTransactionToDelete(undefined);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(undefined);
  };

  const handleSubmit = (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedTransaction) {
      updateTransaction(selectedTransaction.id, transactionData);
    } else {
      const newTransaction: Transaction = {
        ...transactionData,
        id: `txn-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addTransaction(newTransaction);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Transactions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          data-testid="new-transaction-button"
        >
          New Transaction
        </Button>
      </Box>

      <TransactionList
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        transactionTypes={transactionTypes}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TransactionDialog
        open={dialogOpen}
        transaction={selectedTransaction}
        accounts={accounts}
        categories={categories}
        transactionTypes={transactionTypes}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
      />

      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Transaction</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
