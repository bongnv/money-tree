import type { MoneyTreeDB } from '../db/database';
import type { Transaction, TransactionType, Account } from '../types/models';
import type { Group } from '../types/enums';
import type { SyncMetadataService } from './syncMetadata.service';
import { generateId } from '../utils/id.utils';
import { validationService, ValidationError } from './validation.service';

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

const addTimestamps = (entity: Partial<Transaction>, isUpdate = false): Partial<Transaction> => {
  const now = new Date().toISOString();
  return {
    ...entity,
    createdAt: isUpdate ? entity.createdAt : entity.createdAt || now,
    updatedAt: now,
  };
};

const softDelete = (entity: Partial<Transaction>): Partial<Transaction> => ({
  ...entity,
  isDeleted: true,
});

export class TransactionService {
  constructor(
    private db: MoneyTreeDB,
    private syncMetadata: SyncMetadataService
  ) {}

  async getAll(): Promise<Transaction[]> {
    return await this.db.transactions.toArray();
  }

  async getById(id: string): Promise<Transaction | undefined> {
    return await this.db.transactions.get(id);
  }

  async getActive(): Promise<Transaction[]> {
    return await this.db.transactions.filter((txn) => !txn.isDeleted).toArray();
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return await this.db.transactions
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async create(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ): Promise<string> {
    const id = generateId();
    const transaction = addTimestamps({
      ...data,
      id,
      isDeleted: false,
    });

    await this.db.transactions.add(transaction as Transaction);
    await this.syncMetadata.setLastModified();
    return id;
  }

  async update(
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await this.db.transactions.get(id);
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await this.db.transactions.update(id, updated);
    await this.syncMetadata.setLastModified();
  }

  async delete(id: string): Promise<void> {
    const existing = await this.db.transactions.get(id);
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    const deleted = addTimestamps(softDelete(existing), true);
    await this.db.transactions.update(id, deleted);
    await this.syncMetadata.setLastModified();
  }

  filterTransactions(
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
      if (
        filters.transactionTypeId &&
        transaction.transactionTypeId !== filters.transactionTypeId
      ) {
        return false;
      }

      // Category filter (via transaction type)
      if (filters.categoryIds.length > 0) {
        const transactionType = transactionTypes.find(
          (t) => t.id === transaction.transactionTypeId
        );
        if (!transactionType || !filters.categoryIds.includes(transactionType.categoryId)) {
          return false;
        }
      }

      // Group filter (via transaction type)
      if (filters.group) {
        const transactionType = transactionTypes.find(
          (t) => t.id === transaction.transactionTypeId
        );
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
  validateTransactionForm(
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
  transformFormToTransaction(
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
  deriveTransactionType(
    formData: TransactionFormData,
    transactionTypes: TransactionType[]
  ): TransactionType | null {
    if (!formData.transactionTypeId) return null;
    return transactionTypes.find((tt) => tt.id === formData.transactionTypeId) || null;
  }
}
