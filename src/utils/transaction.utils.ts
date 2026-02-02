import type { Transaction, TransactionType, Account } from '@/types/models';
import type { Group } from '@/types/enums';
import { validationService, ValidationError } from '@/services/validation.service';

export interface TransactionFormData {
  date: string;
  description: string;
  amount: string;
  transactionTypeId: string;
  fromAccountId?: string;
  toAccountId?: string;
  fromAssetId?: string;
  toAssetId?: string;
}

export interface TransactionFilters {
  dateFrom: string;
  dateTo: string;
  accountIds: string[];
  categoryIds: string[];
  transactionTypeId: string;
  searchText: string;
  group: Group | '';
}

/**
 * Filter transactions based on criteria
 * Used by transaction filters hook
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
  transactionTypes: TransactionType[]
): Transaction[] {
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
    if (filters.transactionTypeId && transaction.transactionTypeId !== filters.transactionTypeId) {
      return false;
    }

    // Category filter (via transaction type)
    if (filters.categoryIds.length > 0) {
      const transactionType = transactionTypes.find((t) => t.id === transaction.transactionTypeId);
      if (!transactionType || !filters.categoryIds.includes(transactionType.categoryId)) {
        return false;
      }
    }

    // Group filter (via transaction type)
    if (filters.group) {
      const transactionType = transactionTypes.find((t) => t.id === transaction.transactionTypeId);
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
}

/**
 * Validate transaction form data
 * @param formData Form data to validate
 * @param transactionType Transaction type details
 * @param accounts All available accounts
 * @returns Array of validation errors
 */
export function validateTransactionForm(
  formData: TransactionFormData,
  transactionType?: TransactionType,
  accounts?: Account[]
): ValidationError[] {
  // Parse form data
  const partialTransaction: Partial<Transaction> = {
    date: formData.date,
    description: formData.description,
    amount: parseFloat(formData.amount),
    transactionTypeId: formData.transactionTypeId || undefined,
    fromAccountId: formData.fromAccountId || undefined,
    toAccountId: formData.toAccountId || undefined,
    fromAssetId: formData.fromAssetId || undefined,
    toAssetId: formData.toAssetId || undefined,
  };

  // Find related accounts
  const fromAccount = formData.fromAccountId
    ? accounts?.find((a) => a.id === formData.fromAccountId)
    : undefined;
  const toAccount = formData.toAccountId
    ? accounts?.find((a) => a.id === formData.toAccountId)
    : undefined;

  // Delegate to validation service
  return validationService.validateTransaction(
    partialTransaction,
    transactionType,
    fromAccount,
    toAccount
  );
}

/**
 * Transform form data to Transaction entity
 * @param formData Form data to transform
 * @returns Transaction data ready for create/update
 */
export function transformFormToTransaction(
  formData: TransactionFormData
): Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'> {
  return {
    date: formData.date,
    description: formData.description.trim() || undefined,
    amount: parseFloat(formData.amount),
    transactionTypeId: formData.transactionTypeId,
    fromAccountId: formData.fromAccountId || undefined,
    toAccountId: formData.toAccountId || undefined,
    fromAssetId: formData.fromAssetId || undefined,
    toAssetId: formData.toAssetId || undefined,
  };
}

/**
 * Derive transaction type group based on form data
 * @param formData Form data
 * @param transactionTypes All transaction types
 * @returns Transaction group or null
 */
export function deriveTransactionType(
  formData: TransactionFormData,
  transactionTypes: TransactionType[]
): TransactionType | null {
  if (!formData.transactionTypeId) return null;
  return transactionTypes.find((tt) => tt.id === formData.transactionTypeId) || null;
}
