import type { Transaction, Account, TransactionType, Category } from '../types/models';
import { Group } from '../types/enums';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation service for transaction business rules
 */
class ValidationService {
  /**
   * Validate transaction data
   * @param transaction Transaction to validate
   * @param transactionType Transaction type details
   * @param category Category details
   * @param fromAccount From account (if applicable)
   * @param toAccount To account (if applicable)
   * @returns Array of validation errors
   */
  validateTransaction(
    transaction: Partial<Transaction>,
    transactionType?: TransactionType,
    category?: Category,
    fromAccount?: Account,
    toAccount?: Account
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate required fields
    if (!transaction.date) {
      errors.push({ field: 'date', message: 'Date is required' });
    }

    if (!transaction.amount || transaction.amount <= 0) {
      errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
    }

    if (!transaction.transactionTypeId) {
      errors.push({ field: 'transactionTypeId', message: 'Transaction type is required' });
    }

    // Validate accounts based on group
    if (category && transactionType) {
      const accountErrors = this.validateAccountsByGroup(
        category.group,
        transaction.fromAccountId,
        transaction.toAccountId
      );
      errors.push(...accountErrors);
    }

    // Validate account existence and status
    if (transaction.fromAccountId && fromAccount) {
      if (!fromAccount.isActive) {
        errors.push({ field: 'fromAccountId', message: 'From account is not active' });
      }
    }

    if (transaction.toAccountId && toAccount) {
      if (!toAccount.isActive) {
        errors.push({ field: 'toAccountId', message: 'To account is not active' });
      }
    }

    // Validate transfer accounts are different
    if (
      transaction.fromAccountId &&
      transaction.toAccountId &&
      transaction.fromAccountId === transaction.toAccountId
    ) {
      errors.push({
        field: 'toAccountId',
        message: 'From and To accounts must be different for transfers',
      });
    }

    return errors;
  }

  /**
   * Validate accounts based on transaction group
   * @param group Transaction group
   * @param fromAccountId From account ID
   * @param toAccountId To account ID
   * @returns Array of validation errors
   */
  private validateAccountsByGroup(
    group: Group,
    fromAccountId?: string,
    toAccountId?: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (group) {
      case Group.EXPENSE:
        if (!fromAccountId) {
          errors.push({ field: 'fromAccountId', message: 'From account is required for expenses' });
        }
        if (toAccountId) {
          errors.push({ field: 'toAccountId', message: 'To account should not be set for expenses' });
        }
        break;

      case Group.INCOME:
        if (!toAccountId) {
          errors.push({ field: 'toAccountId', message: 'To account is required for income' });
        }
        if (fromAccountId) {
          errors.push({ field: 'fromAccountId', message: 'From account should not be set for income' });
        }
        break;

      case Group.TRANSFER:
        if (!fromAccountId) {
          errors.push({ field: 'fromAccountId', message: 'From account is required for transfers' });
        }
        if (!toAccountId) {
          errors.push({ field: 'toAccountId', message: 'To account is required for transfers' });
        }
        break;

      case Group.INVESTMENT:
        if (!toAccountId) {
          errors.push({ field: 'toAccountId', message: 'To account is required for investments' });
        }
        if (fromAccountId) {
          errors.push({
            field: 'fromAccountId',
            message: 'From account should not be set for investments',
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Check if account can be deleted
   * @param accountId Account ID to check
   * @param transactions All transactions
   * @returns True if account has no transactions
   */
  canDeleteAccount(accountId: string, transactions: Transaction[]): boolean {
    return !transactions.some(
      (t) => t.fromAccountId === accountId || t.toAccountId === accountId
    );
  }

  /**
   * Check if transaction type can be deleted
   * @param transactionTypeId Transaction type ID to check
   * @param transactions All transactions
   * @returns True if transaction type has no transactions
   */
  canDeleteTransactionType(transactionTypeId: string, transactions: Transaction[]): boolean {
    return !transactions.some((t) => t.transactionTypeId === transactionTypeId);
  }

  /**
   * Check if category can be deleted
   * @param categoryId Category ID to check
   * @param transactionTypes All transaction types
   * @returns True if category has no transaction types
   */
  canDeleteCategory(categoryId: string, transactionTypes: TransactionType[]): boolean {
    return !transactionTypes.some((tt) => tt.categoryId === categoryId);
  }
}

export const validationService = new ValidationService();
