import { create } from 'zustand';
import type { Account } from '../types/models';
import { useAppStore } from './useAppStore';

interface AccountState {
  accounts: Account[];
}

interface AccountActions {
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  getAccountById: (id: string) => Account | undefined;
  getAccountsByType: (type: Account['type']) => Account[];
  resetAccounts: () => void;
}

export const useAccountStore = create<AccountState & AccountActions>((set, get) => ({
  accounts: [],

  setAccounts: (accounts) => {
    set({ accounts });
  },

  addAccount: (account) => {
    set((state) => ({
      accounts: [...state.accounts, account],
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  updateAccount: (id, updates) => {
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id
          ? { ...account, ...updates, updatedAt: new Date().toISOString() }
          : account
      ),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  deleteAccount: (id) => {
    set((state) => ({
      accounts: state.accounts.filter((account) => account.id !== id),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  getAccountById: (id) => {
    return get().accounts.find((account) => account.id === id);
  },

  getAccountsByType: (type) => {
    return get().accounts.filter((account) => account.type === type);
  },

  resetAccounts: () => {
    set({ accounts: [] });
  },
}));
