import { Add as AddIcon } from '@mui/icons-material';
import { Box, Typography, Button } from '@mui/material';
import React, { useState } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useStore } from '@/contexts/StoreContext';
import { useTransactionDialog } from '@/hooks/transactions/useTransactionDialog';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import type { Transaction } from '@/types/models';
import { QuickEntryRow } from './QuickEntryRow';
import { TransactionDialog } from './TransactionDialog';
import { TransactionFilters } from './TransactionFilters';
import { TransactionList } from './TransactionList';

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    transactionTypes,
    assets,
    addTransaction,
    updateTransaction,
    deleteTransaction: deleteTransactionOp,
  } = useStore();
  const transactionDialog = useTransactionDialog();
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);

  const { filters, setFilters, filteredTransactions } = useTransactionFilters({
    transactions,
    transactionTypes,
  });

  // Filter accounts to active only
  const activeAccounts = accounts?.filter((acc) => acc.isActive);

  const handleOpenDialog = () => {
    transactionDialog.openCreate();
  };

  const handleEdit = (transaction: Transaction) => {
    transactionDialog.openEdit(transaction);
  };

  const handleDelete = (transaction: Transaction) => {
    setDeleteTransaction(transaction);
  };

  const handleConfirmDelete = async () => {
    if (deleteTransaction?.id) {
      await deleteTransactionOp(deleteTransaction.id);
      setDeleteTransaction(null);
    }
  };

  const handleSubmit = async (
    transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => {
    if (transactionDialog.selectedItem?.id) {
      await updateTransaction(transactionDialog.selectedItem.id, transactionData);
    } else {
      await addTransaction(transactionData);
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

      <TransactionFilters
        accounts={activeAccounts || []}
        categories={categories || []}
        transactionTypes={transactionTypes || []}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <QuickEntryRow
          accounts={activeAccounts || []}
          categories={categories || []}
          transactionTypes={transactionTypes || []}
          transactions={transactions || []}
          manualAssets={assets || []}
          onSubmit={handleSubmit}
          onOpenFullDialog={handleOpenDialog}
        />
      </Box>

      <TransactionList
        transactions={filteredTransactions}
        accounts={activeAccounts || []}
        categories={categories || []}
        transactionTypes={transactionTypes || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TransactionDialog
        open={transactionDialog.isOpen}
        transaction={transactionDialog.selectedItem || undefined}
        accounts={activeAccounts || []}
        categories={categories || []}
        transactionTypes={transactionTypes || []}
        onClose={transactionDialog.close}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTransaction}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTransaction(null)}
        confirmText="Delete"
        severity="error"
      />
    </Box>
  );
};
