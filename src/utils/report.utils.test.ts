import { Group } from '@/types/enums';
import type { TransactionType } from '@/types/models';
import { hasTransactionTypesInGroup } from './report.utils';

describe('report.utils', () => {
  const mockTransactionTypes: TransactionType[] = [
    {
      id: 'type1',
      name: 'Salary',
      categoryId: 'cat1',
      group: Group.INCOME,
      isActive: true,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'type2',
      name: 'Bonus',
      categoryId: 'cat1',
      group: Group.INCOME,
      isActive: true,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'type3',
      name: 'Groceries',
      categoryId: 'cat2',
      group: Group.EXPENSE,
      isActive: true,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'type4',
      name: 'Rent',
      categoryId: 'cat3',
      group: Group.EXPENSE,
      isActive: true,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  describe('hasTransactionTypesInGroup', () => {
    it('should return true when no categories are selected', () => {
      const result = hasTransactionTypesInGroup([], mockTransactionTypes, Group.INCOME);
      expect(result).toBe(true);
    });

    it('should return true when filtered categories contain income types', () => {
      const result = hasTransactionTypesInGroup(['cat1'], mockTransactionTypes, Group.INCOME);
      expect(result).toBe(true);
    });

    it('should return false when filtered categories do not contain income types', () => {
      const result = hasTransactionTypesInGroup(['cat2'], mockTransactionTypes, Group.INCOME);
      expect(result).toBe(false);
    });

    it('should return true when filtered categories contain expense types', () => {
      const result = hasTransactionTypesInGroup(['cat2'], mockTransactionTypes, Group.EXPENSE);
      expect(result).toBe(true);
    });

    it('should return false when filtered categories do not contain expense types', () => {
      const result = hasTransactionTypesInGroup(['cat1'], mockTransactionTypes, Group.EXPENSE);
      expect(result).toBe(false);
    });

    it('should return true when multiple categories are selected and at least one has the group', () => {
      const result = hasTransactionTypesInGroup(
        ['cat1', 'cat2'],
        mockTransactionTypes,
        Group.INCOME
      );
      expect(result).toBe(true);
    });
  });
});
