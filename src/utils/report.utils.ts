import { Group } from '../types/enums';
import type { TransactionType } from '../types/models';

/**
 * Check if filtered categories contain any transaction types with the specified group
 */
export const hasTransactionTypesInGroup = (
  selectedCategories: string[],
  transactionTypes: TransactionType[],
  group: Group
): boolean => {
  if (selectedCategories.length === 0) return true; // Show all when no filter
  return transactionTypes.some(
    (tt) => selectedCategories.includes(tt.categoryId) && tt.group === group
  );
};
