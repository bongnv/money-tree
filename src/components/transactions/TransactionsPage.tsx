import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
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
import { TransactionDialog } from './TransactionDialog';
import { TransactionList } from './TransactionList';
import { TransactionFilters, TransactionFiltersState } from './TransactionFilters';
import { QuickEntryRow } from './QuickEntryRow';
import { getTodayDate } from '../../utils/date.utils';
import { useActiveAccounts } from '../../hooks/useAccounts';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useTransactionTypes } from '../../hooks/useTransactionTypes';
import { useAssets } from '../../hooks/useAssets';
import { useTransactionService } from '../../contexts/ServiceProviders';

export const TransactionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const transactions = useTransactions();
  const accounts = useActiveAccounts();
  const categories = useCategories();
  const transactionTypes = useTransactionTypes();
  const manualAssets = useAssets();
  const transactionService = useTransactionService();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | undefined>();

  // Default to Year to Date
  const today = getTodayDate();
  const yearStart = `${today.slice(0, 4)}-01-01`;

  const [filters, setFilters] = useState<TransactionFiltersState>({
    dateFrom: yearStart,
    dateTo: today,
    accountIds: [],
    categoryIds: [],
    transactionTypeId: '',
    searchText: '',
    group: '',
  });

  // Read URL parameters and location state, and apply to filters on mount (only once)
  useEffect(() => {
    // Read from search params
    const categoryId = searchParams.get('categoryId');
    const transactionTypeId = searchParams.get('transactionTypeId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Read from location state (passed via navigate)
    const stateFilters = (location.state as { filters?: Partial<TransactionFiltersState> })
      ?.filters;

    if (categoryId || transactionTypeId || dateFrom || dateTo || stateFilters) {
      setFilters({
        dateFrom: dateFrom || stateFilters?.dateFrom || '',
        dateTo: dateTo || stateFilters?.dateTo || '',
        accountIds: stateFilters?.accountIds || [],
        categoryIds: categoryId ? [categoryId] : stateFilters?.categoryIds || [],
        transactionTypeId: transactionTypeId || stateFilters?.transactionTypeId || '',
        searchText: stateFilters?.searchText || '',
        group: stateFilters?.group || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Filter transactions based on filter state
  const filteredTransactions = useMemo(() => {
    if (!transactions || !transactionTypes) return [];
    return transactionService.filterTransactions(transactions, filters, transactionTypes);
    // transactionService is stable from context, no need to include
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, filters, transactionTypes]);

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

  const handleConfirmDelete = async () => {
    if (transactionToDelete?.id) {
      await transactionService.delete(transactionToDelete.id);
    }
    setDeleteDialogOpen(false);
    setTransactionToDelete(undefined);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(undefined);
  };

  const handleSubmit = async (
    transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => {
    if (selectedTransaction?.id) {
      await transactionService.update(selectedTransaction.id, transactionData);
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
        open={dialogOpen}
        transaction={selectedTransaction}
        accounts={accounts || []}
        categories={categories || []}
        transactionTypes={transactionTypes || []}
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
