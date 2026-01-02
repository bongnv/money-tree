import { create } from 'zustand';
import type { Transaction } from '../types/models';
import { useAppStore } from './useAppStore';

interface TransactionState {
  transactions: Transaction[];
}

interface TransactionActions {
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getTransactionsByType: (transactionTypeId: string) => Transaction[];
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  resetTransactions: () => void;
}

export const useTransactionStore = create<TransactionState & TransactionActions>((set, get) => ({
  transactions: [],

  setTransactions: (transactions) => {
    set({ transactions });
  },

  addTransaction: (transaction) => {
    set((state) => ({
      transactions: [...state.transactions, transaction],
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  updateTransaction: (id, updates) => {
    set((state) => ({
      transactions: state.transactions.map((transaction) =>
        transaction.id === id
          ? { ...transaction, ...updates, updatedAt: new Date().toISOString() }
          : transaction
      ),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  deleteTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.filter((transaction) => transaction.id !== id),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  getTransactionById: (id) => {
    return get().transactions.find((transaction) => transaction.id === id);
  },

  getTransactionsByAccount: (accountId) => {
    return get().transactions.filter(
      (transaction) =>
        transaction.fromAccountId === accountId || transaction.toAccountId === accountId
    );
  },

  getTransactionsByType: (transactionTypeId) => {
    return get().transactions.filter(
      (transaction) => transaction.transactionTypeId === transactionTypeId
    );
  },

  getTransactionsByDateRange: (startDate, endDate) => {
    return get().transactions.filter((transaction) => {
      return transaction.date >= startDate && transaction.date <= endDate;
    });
  },

  resetTransactions: () => {
    set({ transactions: [] });
  },
}));
