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

/**
 * Check if two budget date ranges overlap
 * @param budget1 First budget
 * @param budget2 Second budget
 * @returns true if date ranges overlap
 */
function dateRangesOverlap(budget1: Budget, budget2: Budget): boolean {
  // Check if ranges overlap: start1 <= end2 AND start2 <= end1
  return budget1.startDate <= budget2.endDate && budget2.startDate <= budget1.endDate;
}

export const useBudgetStore = create<BudgetState & BudgetActions>((set, get) => ({
  budgets: [],

  setBudgets: (budgets) => {
    set({ budgets });
  },

  addBudget: (budget) => {
    // Check for overlapping budgets with the same transaction type
    const existingBudgets = get().budgets.filter(
      (b) => b.transactionTypeId === budget.transactionTypeId
    );

    const hasOverlap = existingBudgets.some((existing) =>
      dateRangesOverlap(budget, existing)
    );

    if (hasOverlap) {
      throw new Error(
        'A budget with overlapping dates already exists for this transaction type'
      );
    }

    set((state) => ({
      budgets: [...state.budgets, budget],
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  updateBudget: (id, updates) => {
    const currentBudget = get().getBudgetById(id);
    if (!currentBudget) {
      throw new Error('Budget not found');
    }

    const updatedBudget = { ...currentBudget, ...updates };

    // Check for overlapping budgets with the same transaction type (excluding current budget)
    const existingBudgets = get().budgets.filter(
      (b) => b.transactionTypeId === updatedBudget.transactionTypeId && b.id !== id
    );

    const hasOverlap = existingBudgets.some((existing) =>
      dateRangesOverlap(updatedBudget as Budget, existing)
    );

    if (hasOverlap) {
      throw new Error(
        'A budget with overlapping dates already exists for this transaction type'
      );
    }

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
