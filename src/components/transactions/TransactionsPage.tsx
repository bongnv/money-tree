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
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useTransactionMutations } from '../../hooks/mutations/useTransactionMutations';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { useCategories, useTransactionTypes } from '../../hooks/queries';
import { useAssets } from '../../hooks/queries/useAssets';
import { TransactionDialog } from './TransactionDialog';
import { TransactionList } from './TransactionList';
import { TransactionFilters, TransactionFiltersState } from './TransactionFilters';
import { QuickEntryRow } from './QuickEntryRow';
import { getTodayDate } from '../../utils/date.utils';

export const TransactionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const transactions = useTransactions();
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactionMutations();
  const accounts = useAccounts();
  const categories = useCategories();
  const transactionTypes = useTransactionTypes();
  const manualAssets = useAssets();
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
    const stateFilters = (location.state as any)?.filters;

    if (categoryId || transactionTypeId || dateFrom || dateTo || stateFilters) {
      setFilters({
        dateFrom: dateFrom || stateFilters?.dateFrom || '',
        dateTo: dateTo || stateFilters?.dateTo || '',
        accountIds: stateFilters?.account || [],
        categoryIds: categoryId ? [categoryId] : stateFilters?.categoryIds || [],
        transactionTypeId: transactionTypeId || stateFilters?.transactionType?.[0] || '',
        searchText: stateFilters?.searchText || '',
        group: stateFilters?.group || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Filter transactions based on filter state
  const filteredTransactions = useMemo(() => {
    if (!transactions || !transactionTypes) return [];
    return transactions.filter((transaction) => {
      // Date range filter
      if (filters.dateFrom && transaction.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && transaction.date > filters.dateTo) {
        return false;
      }

      // Account filter (checks both from and to accounts)
      if (filters.accountIds.length > 0) {
        const matchesAccount =
          (transaction.fromAccountId && filters.accountIds.includes(transaction.fromAccountId)) ||
          (transaction.toAccountId && filters.accountIds.includes(transaction.toAccountId));
        if (!matchesAccount) {
          return false;
        }
      }

      // Transaction type filter
      if (
        filters.transactionTypeId &&
        transaction.transactionTypeId !== filters.transactionTypeId
      ) {
        return false;
      }

      // Category filter (via transaction type)
      if (filters.categoryIds.length > 0) {
        const transactionType = transactionTypes.find(
          (t) => t.id === transaction.transactionTypeId
        );
        if (!transactionType || !filters.categoryIds.includes(transactionType.categoryId)) {
          return false;
        }
      }

      // Group filter (via transaction type)
      if (filters.group) {
        const transactionType = transactionTypes.find(
          (t) => t.id === transaction.transactionTypeId
        );
        if (!transactionType || transactionType.group !== filters.group) {
          return false;
        }
      }

      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const descriptionMatch = transaction.description?.toLowerCase().includes(searchLower);
        if (!descriptionMatch) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filters, transactionTypes, categories]);

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
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete.id);
    }
    setDeleteDialogOpen(false);
    setTransactionToDelete(undefined);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(undefined);
  };

  const handleSubmit = async (
    transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (selectedTransaction) {
      await updateTransaction(selectedTransaction.id, transactionData);
    } else {
      const newTransaction: Transaction = {
        ...transactionData,
        id: `txn-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addTransaction(newTransaction);
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
