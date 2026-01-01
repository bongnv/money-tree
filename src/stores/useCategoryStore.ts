import { create } from 'zustand';
import type { Category, TransactionType } from '../types/models';
import { useAppStore } from './useAppStore';

interface CategoryState {
  categories: Category[];
  transactionTypes: TransactionType[];
}

interface CategoryActions {
  setCategories: (categories: Category[]) => void;
  setTransactionTypes: (transactionTypes: TransactionType[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;
  getCategoriesByGroup: (group: Category['group']) => Category[];
  addTransactionType: (transactionType: TransactionType) => void;
  updateTransactionType: (id: string, updates: Partial<TransactionType>) => void;
  deleteTransactionType: (id: string) => void;
  getTransactionTypeById: (id: string) => TransactionType | undefined;
  getTransactionTypesByCategory: (categoryId: string) => TransactionType[];
  resetCategories: () => void;
}

export const useCategoryStore = create<CategoryState & CategoryActions>((set, get) => ({
  categories: [],
  transactionTypes: [],

  setCategories: (categories) => {
    set({ categories });
  },

  setTransactionTypes: (transactionTypes) => {
    set({ transactionTypes });
  },

  addCategory: (category) => {
    set((state) => ({
      categories: [...state.categories, category],
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  updateCategory: (id, updates) => {
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === id
          ? { ...category, ...updates, updatedAt: new Date().toISOString() }
          : category
      ),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  deleteCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((category) => category.id !== id),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  getCategoryById: (id) => {
    return get().categories.find((category) => category.id === id);
  },

  getCategoriesByGroup: (group) => {
    return get().categories.filter((category) => category.group === group);
  },

  addTransactionType: (transactionType) => {
    set((state) => ({
      transactionTypes: [...state.transactionTypes, transactionType],
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  updateTransactionType: (id, updates) => {
    set((state) => ({
      transactionTypes: state.transactionTypes.map((transactionType) =>
        transactionType.id === id
          ? { ...transactionType, ...updates, updatedAt: new Date().toISOString() }
          : transactionType
      ),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  deleteTransactionType: (id) => {
    set((state) => ({
      transactionTypes: state.transactionTypes.filter(
        (transactionType) => transactionType.id !== id
      ),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  getTransactionTypeById: (id) => {
    return get().transactionTypes.find((transactionType) => transactionType.id === id);
  },

  getTransactionTypesByCategory: (categoryId) => {
    return get().transactionTypes.filter(
      (transactionType) => transactionType.categoryId === categoryId
    );
  },

  resetCategories: () => {
    set({ categories: [], transactionTypes: [] });
  },
}));
