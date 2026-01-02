import React, { useState } from 'react';
import { QuickEntryRow } from '../transactions/QuickEntryRow';
import { TransactionDialog } from '../transactions/TransactionDialog';
import { useAccountStore } from '../../stores/useAccountStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import type { Transaction } from '../../types/models';

export const QuickEntryContainer: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const accounts = useAccountStore((state) => state.accounts);
  const categories = useCategoryStore((state) => state.categories);
  const transactionTypes = useCategoryStore((state) => state.transactionTypes);
  const addTransaction = useTransactionStore((state) => state.addTransaction);

  const handleSubmit = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addTransaction(newTransaction);
  };

  const handleOpenFullDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleDialogSubmit = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    handleSubmit(transaction);
    setDialogOpen(false);
  };

  return (
    <>
      <QuickEntryRow
        accounts={accounts}
        categories={categories}
        transactionTypes={transactionTypes}
        onSubmit={handleSubmit}
        onOpenFullDialog={handleOpenFullDialog}
      />
      <TransactionDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleDialogSubmit}
        transaction={undefined}
        accounts={accounts}
        categories={categories}
        transactionTypes={transactionTypes}
      />
    </>
  );
};
