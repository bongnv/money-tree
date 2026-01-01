import { renderHook, act } from '@testing-library/react';
import { useCategoryStore } from './useCategoryStore';
import { useAppStore } from './useAppStore';
import { Group } from '../types/enums';
import type { Category, TransactionType } from '../types/models';

describe('useCategoryStore', () => {
  const mockCategory: Category = {
    id: 'cat-1',
    name: 'Test Category',
    group: Group.EXPENSE,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockTransactionType: TransactionType = {
    id: 'tt-1',
    name: 'Test Transaction Type',
    categoryId: 'cat-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    const { result } = renderHook(() => useCategoryStore());
    act(() => {
      result.current.resetCategories();
    });
    const { result: appResult } = renderHook(() => useAppStore());
    act(() => {
      appResult.current.setUnsavedChanges(false);
    });
  });

  describe('setCategories', () => {
    it('should set categories', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.setCategories([mockCategory]);
      });

      expect(result.current.categories).toHaveLength(1);
      expect(result.current.categories[0]).toEqual(mockCategory);
    });

    it('should replace existing categories', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.setCategories([mockCategory]);
      });

      const newCategory: Category = { ...mockCategory, id: 'cat-2', name: 'New Category' };

      act(() => {
        result.current.setCategories([newCategory]);
      });

      expect(result.current.categories).toHaveLength(1);
      expect(result.current.categories[0]).toEqual(newCategory);
    });
  });

  describe('setTransactionTypes', () => {
    it('should set transaction types', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.setTransactionTypes([mockTransactionType]);
      });

      expect(result.current.transactionTypes).toHaveLength(1);
      expect(result.current.transactionTypes[0]).toEqual(mockTransactionType);
    });

    it('should replace existing transaction types', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.setTransactionTypes([mockTransactionType]);
      });

      const newType: TransactionType = {
        ...mockTransactionType,
        id: 'tt-2',
        name: 'New Type',
      };

      act(() => {
        result.current.setTransactionTypes([newType]);
      });

      expect(result.current.transactionTypes).toHaveLength(1);
      expect(result.current.transactionTypes[0]).toEqual(newType);
    });
  });

  describe('addCategory', () => {
    it('should add a new category', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.addCategory(mockCategory);
      });

      expect(result.current.categories).toHaveLength(1);
      expect(result.current.categories[0]).toEqual(mockCategory);
    });

    it('should mark changes as unsaved', () => {
      const { result } = renderHook(() => useCategoryStore());
      const { result: appResult } = renderHook(() => useAppStore());

      act(() => {
        result.current.addCategory(mockCategory);
      });

      expect(appResult.current.hasUnsavedChanges).toBe(true);
    });

    it('should add multiple categories', () => {
      const { result } = renderHook(() => useCategoryStore());
      const category2: Category = { ...mockCategory, id: 'cat-2', name: 'Category 2' };

      act(() => {
        result.current.addCategory(mockCategory);
        result.current.addCategory(category2);
      });

      expect(result.current.categories).toHaveLength(2);
    });
  });

  describe('updateCategory', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCategoryStore());
      act(() => {
        result.current.addCategory(mockCategory);
      });
    });

    it('should update an existing category', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.updateCategory('cat-1', { name: 'Updated Name' });
      });

      expect(result.current.categories[0].name).toBe('Updated Name');
    });

    it('should update the updatedAt timestamp', () => {
      const { result } = renderHook(() => useCategoryStore());
      const originalTimestamp = mockCategory.updatedAt;

      act(() => {
        result.current.updateCategory('cat-1', { name: 'Updated Name' });
      });

      expect(result.current.categories[0].updatedAt).not.toBe(originalTimestamp);
    });

    it('should mark changes as unsaved', () => {
      const { result } = renderHook(() => useCategoryStore());
      const { result: appResult } = renderHook(() => useAppStore());

      act(() => {
        appResult.current.setUnsavedChanges(false);
      });

      act(() => {
        result.current.updateCategory('cat-1', { name: 'Updated Name' });
      });

      expect(appResult.current.hasUnsavedChanges).toBe(true);
    });

    it('should not update non-existent category', () => {
      const { result } = renderHook(() => useCategoryStore());
      const originalCategories = [...result.current.categories];

      act(() => {
        result.current.updateCategory('non-existent', { name: 'Updated Name' });
      });

      expect(result.current.categories).toEqual(originalCategories);
    });

    it('should update multiple fields', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.updateCategory('cat-1', {
          name: 'New Name',
          description: 'New Description',
        });
      });

      expect(result.current.categories[0].name).toBe('New Name');
      expect(result.current.categories[0].description).toBe('New Description');
    });
  });

  describe('deleteCategory', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCategoryStore());
      act(() => {
        result.current.addCategory(mockCategory);
      });
    });

    it('should delete an existing category', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.deleteCategory('cat-1');
      });

      expect(result.current.categories).toHaveLength(0);
    });

    it('should mark changes as unsaved', () => {
      const { result } = renderHook(() => useCategoryStore());
      const { result: appResult } = renderHook(() => useAppStore());

      act(() => {
        appResult.current.setUnsavedChanges(false);
      });

      act(() => {
        result.current.deleteCategory('cat-1');
      });

      expect(appResult.current.hasUnsavedChanges).toBe(true);
    });

    it('should not affect other categories', () => {
      const { result } = renderHook(() => useCategoryStore());
      const category2: Category = { ...mockCategory, id: 'cat-2', name: 'Category 2' };

      act(() => {
        result.current.addCategory(category2);
      });

      act(() => {
        result.current.deleteCategory('cat-1');
      });

      expect(result.current.categories).toHaveLength(1);
      expect(result.current.categories[0].id).toBe('cat-2');
    });
  });

  describe('getCategoryById', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCategoryStore());
      act(() => {
        result.current.addCategory(mockCategory);
      });
    });

    it('should return category by id', () => {
      const { result } = renderHook(() => useCategoryStore());

      const category = result.current.getCategoryById('cat-1');

      expect(category).toEqual(mockCategory);
    });

    it('should return undefined for non-existent category', () => {
      const { result } = renderHook(() => useCategoryStore());

      const category = result.current.getCategoryById('non-existent');

      expect(category).toBeUndefined();
    });
  });

  describe('getCategoriesByGroup', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCategoryStore());
      const incomeCategory: Category = {
        ...mockCategory,
        id: 'cat-income',
        group: Group.INCOME,
      };
      const expenseCategory: Category = {
        ...mockCategory,
        id: 'cat-expense',
        group: Group.EXPENSE,
      };

      act(() => {
        result.current.addCategory(incomeCategory);
        result.current.addCategory(expenseCategory);
      });
    });

    it('should return categories by group', () => {
      const { result } = renderHook(() => useCategoryStore());

      const incomeCategories = result.current.getCategoriesByGroup(Group.INCOME);
      const expenseCategories = result.current.getCategoriesByGroup(Group.EXPENSE);

      expect(incomeCategories).toHaveLength(1);
      expect(incomeCategories[0].group).toBe(Group.INCOME);
      expect(expenseCategories).toHaveLength(1);
      expect(expenseCategories[0].group).toBe(Group.EXPENSE);
    });

    it('should return empty array for group with no categories', () => {
      const { result } = renderHook(() => useCategoryStore());

      const transferCategories = result.current.getCategoriesByGroup(Group.TRANSFER);

      expect(transferCategories).toHaveLength(0);
    });
  });

  describe('addTransactionType', () => {
    it('should add a new transaction type', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.addTransactionType(mockTransactionType);
      });

      expect(result.current.transactionTypes).toHaveLength(1);
      expect(result.current.transactionTypes[0]).toEqual(mockTransactionType);
    });

    it('should mark changes as unsaved', () => {
      const { result } = renderHook(() => useCategoryStore());
      const { result: appResult } = renderHook(() => useAppStore());

      act(() => {
        result.current.addTransactionType(mockTransactionType);
      });

      expect(appResult.current.hasUnsavedChanges).toBe(true);
    });

    it('should add multiple transaction types', () => {
      const { result } = renderHook(() => useCategoryStore());
      const type2: TransactionType = { ...mockTransactionType, id: 'tt-2', name: 'Type 2' };

      act(() => {
        result.current.addTransactionType(mockTransactionType);
        result.current.addTransactionType(type2);
      });

      expect(result.current.transactionTypes).toHaveLength(2);
    });
  });

  describe('updateTransactionType', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCategoryStore());
      act(() => {
        result.current.addTransactionType(mockTransactionType);
      });
    });

    it('should update an existing transaction type', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.updateTransactionType('tt-1', { name: 'Updated Name' });
      });

      expect(result.current.transactionTypes[0].name).toBe('Updated Name');
    });

    it('should update the updatedAt timestamp', () => {
      const { result } = renderHook(() => useCategoryStore());
      const originalTimestamp = mockTransactionType.updatedAt;

      act(() => {
        result.current.updateTransactionType('tt-1', { name: 'Updated Name' });
      });

      expect(result.current.transactionTypes[0].updatedAt).not.toBe(originalTimestamp);
    });

    it('should mark changes as unsaved', () => {
      const { result } = renderHook(() => useCategoryStore());
      const { result: appResult } = renderHook(() => useAppStore());

      act(() => {
        appResult.current.setUnsavedChanges(false);
      });

      act(() => {
        result.current.updateTransactionType('tt-1', { name: 'Updated Name' });
      });

      expect(appResult.current.hasUnsavedChanges).toBe(true);
    });

    it('should not update non-existent transaction type', () => {
      const { result } = renderHook(() => useCategoryStore());
      const originalTypes = [...result.current.transactionTypes];

      act(() => {
        result.current.updateTransactionType('non-existent', { name: 'Updated Name' });
      });

      expect(result.current.transactionTypes).toEqual(originalTypes);
    });
  });

  describe('deleteTransactionType', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCategoryStore());
      act(() => {
        result.current.addTransactionType(mockTransactionType);
      });
    });

    it('should delete an existing transaction type', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.deleteTransactionType('tt-1');
      });

      expect(result.current.transactionTypes).toHaveLength(0);
    });

    it('should mark changes as unsaved', () => {
      const { result } = renderHook(() => useCategoryStore());
      const { result: appResult } = renderHook(() => useAppStore());

      act(() => {
        appResult.current.setUnsavedChanges(false);
      });

      act(() => {
        result.current.deleteTransactionType('tt-1');
      });

      expect(appResult.current.hasUnsavedChanges).toBe(true);
    });

    it('should not affect other transaction types', () => {
      const { result } = renderHook(() => useCategoryStore());
      const type2: TransactionType = { ...mockTransactionType, id: 'tt-2', name: 'Type 2' };

      act(() => {
        result.current.addTransactionType(type2);
      });

      act(() => {
        result.current.deleteTransactionType('tt-1');
      });

      expect(result.current.transactionTypes).toHaveLength(1);
      expect(result.current.transactionTypes[0].id).toBe('tt-2');
    });
  });

  describe('getTransactionTypeById', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCategoryStore());
      act(() => {
        result.current.addTransactionType(mockTransactionType);
      });
    });

    it('should return transaction type by id', () => {
      const { result } = renderHook(() => useCategoryStore());

      const type = result.current.getTransactionTypeById('tt-1');

      expect(type).toEqual(mockTransactionType);
    });

    it('should return undefined for non-existent transaction type', () => {
      const { result } = renderHook(() => useCategoryStore());

      const type = result.current.getTransactionTypeById('non-existent');

      expect(type).toBeUndefined();
    });
  });

  describe('getTransactionTypesByCategory', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCategoryStore());
      const type1: TransactionType = { ...mockTransactionType, id: 'tt-1', categoryId: 'cat-1' };
      const type2: TransactionType = { ...mockTransactionType, id: 'tt-2', categoryId: 'cat-1' };
      const type3: TransactionType = { ...mockTransactionType, id: 'tt-3', categoryId: 'cat-2' };

      act(() => {
        result.current.addTransactionType(type1);
        result.current.addTransactionType(type2);
        result.current.addTransactionType(type3);
      });
    });

    it('should return transaction types for a category', () => {
      const { result } = renderHook(() => useCategoryStore());

      const types = result.current.getTransactionTypesByCategory('cat-1');

      expect(types).toHaveLength(2);
      expect(types.every((type) => type.categoryId === 'cat-1')).toBe(true);
    });

    it('should return empty array for category with no transaction types', () => {
      const { result } = renderHook(() => useCategoryStore());

      const types = result.current.getTransactionTypesByCategory('cat-3');

      expect(types).toHaveLength(0);
    });
  });

  describe('resetCategories', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCategoryStore());
      act(() => {
        result.current.addCategory(mockCategory);
        result.current.addTransactionType(mockTransactionType);
      });
    });

    it('should reset categories and transaction types', () => {
      const { result } = renderHook(() => useCategoryStore());

      act(() => {
        result.current.resetCategories();
      });

      expect(result.current.categories).toHaveLength(0);
      expect(result.current.transactionTypes).toHaveLength(0);
    });
  });
});
