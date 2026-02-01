import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { Transaction } from '../../types/models';
import { TransactionDialog } from './TransactionDialog';
import { TransactionList } from './TransactionList';
import { TransactionFilters } from './TransactionFilters';
import { QuickEntryRow } from './QuickEntryRow';
import { useActiveAccounts } from '../../hooks/useAccounts';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useTransactionTypes } from '../../hooks/useTransactionTypes';
import { useAssets } from '../../hooks/useAssets';
import { useTransactionService } from '@/hooks/useServices';
import { useTransactionDialog } from '@/hooks/transactions/useTransactionDialog';
import { useTransactionFilters } from '@/hooks/transactions/useTransactionFilters';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export const TransactionsPage: React.FC = () => {
  const transactions = useTransactions();
  const accounts = useActiveAccounts();
  const categories = useCategories();
  const transactionTypes = useTransactionTypes();
  const manualAssets = useAssets();
  const transactionService = useTransactionService();
  const transactionDialog = useTransactionDialog();
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);

  const { filters, setFilters, filteredTransactions } = useTransactionFilters({
    transactions,
    transactionTypes,
  });

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
      await transactionService.delete(deleteTransaction.id);
      setDeleteTransaction(null);
    }
  };

  const handleSubmit = async (
    transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => {
    if (transactionDialog.selectedItem?.id) {
      await transactionService.update(transactionDialog.selectedItem.id, transactionData);
    } else {
      await transactionService.create(transactionData);
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
        accounts={accounts || []}
        categories={categories || []}
        transactionTypes={transactionTypes || []}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <QuickEntryRow
          accounts={accounts || []}
          categories={categories || []}
          transactionTypes={transactionTypes || []}
          transactions={transactions || []}
          manualAssets={manualAssets || []}
          onSubmit={handleSubmit}
          onOpenFullDialog={handleOpenDialog}
        />
      </Box>

      <TransactionList
        transactions={filteredTransactions}
        accounts={accounts || []}
        categories={categories || []}
        transactionTypes={transactionTypes || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TransactionDialog
        open={transactionDialog.isOpen}
        transaction={transactionDialog.selectedItem || undefined}
        accounts={accounts || []}
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
