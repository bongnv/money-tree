import { create } from 'zustand';
import type { Budget } from '../types/models';
import { useAppStore } from './useAppStore';

interface BudgetState {
  budgets: Budget[];
}

interface BudgetActions {
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  getBudgetById: (id: string) => Budget | undefined;
  getBudgetByTransactionTypeId: (transactionTypeId: string) => Budget | undefined;
  resetBudgets: () => void;
}

export const useBudgetStore = create<BudgetState & BudgetActions>((set, get) => ({
  budgets: [],

  setBudgets: (budgets) => {
    set({ budgets });
  },

  addBudget: (budget) => {
    set((state) => ({
      budgets: [...state.budgets, budget],
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  updateBudget: (id, updates) => {
    set((state) => ({
      budgets: state.budgets.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      ),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  deleteBudget: (id) => {
    set((state) => ({
      budgets: state.budgets.filter((item) => item.id !== id),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  getBudgetById: (id) => {
    return get().budgets.find((item) => item.id === id);
  },

  getBudgetByTransactionTypeId: (transactionTypeId) => {
    return get().budgets.find((item) => item.transactionTypeId === transactionTypeId);
  },

  resetBudgets: () => {
    set({ budgets: [] });
  },
}));
