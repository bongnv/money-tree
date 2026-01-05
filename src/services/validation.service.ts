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
    toAccount?: Account,
    _fromAsset?: { id: string; name: string },
    _toAsset?: { id: string; name: string }
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate required fields
    if (!transaction.date) {
      errors.push({ field: 'date', message: 'Date is required' });
    }

    if (
      transaction.amount === undefined ||
      transaction.amount === null ||
      isNaN(transaction.amount)
    ) {
      errors.push({ field: 'amount', message: 'Amount is required' });
    }

    if (!transaction.transactionTypeId) {
      errors.push({ field: 'transactionTypeId', message: 'Transaction type is required' });
    }

    // Validate accounts based on group
    if (category && transactionType) {
      const accountErrors = this.validateAccountsByGroup(
        category.group,
        transaction.fromAccountId,
        transaction.toAccountId,
        transaction.fromAssetId,
        transaction.toAssetId
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
   * @param fromAssetId From asset ID
   * @param toAssetId To asset ID
   * @returns Array of validation errors
   */
  private validateAccountsByGroup(
    group: Group,
    fromAccountId?: string,
    toAccountId?: string,
    fromAssetId?: string,
    toAssetId?: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (group) {
      case Group.EXPENSE:
        if (!fromAccountId) {
          errors.push({ field: 'fromAccountId', message: 'From account is required for expenses' });
        }
        if (toAccountId) {
          errors.push({
            field: 'toAccountId',
            message: 'To account should not be set for expenses',
          });
        }
        break;

      case Group.INCOME:
        if (!toAccountId) {
          errors.push({ field: 'toAccountId', message: 'To account is required for income' });
        }
        if (fromAccountId) {
          errors.push({
            field: 'fromAccountId',
            message: 'From account should not be set for income',
          });
        }
        break;

      case Group.TRANSFER:
        if (!fromAccountId) {
          errors.push({
            field: 'fromAccountId',
            message: 'From account is required for transfers',
          });
        }
        if (!toAccountId) {
          errors.push({ field: 'toAccountId', message: 'To account is required for transfers' });
        }
        break;

      case Group.ASSET_TRANSACTION:
        // Validate exactly one asset ID
        if (!fromAssetId && !toAssetId) {
          errors.push({
            field: 'fromAssetId',
            message: 'Either From Asset or To Asset is required for asset transactions',
          });
        }
        if (fromAssetId && toAssetId) {
          errors.push({
            field: 'toAssetId',
            message: 'Cannot specify both From Asset and To Asset',
          });
        }

        // Validate exactly one account ID
        if (!fromAccountId && !toAccountId) {
          errors.push({
            field: 'fromAccountId',
            message: 'Either From Account or To Account is required for asset transactions',
          });
        }
        if (fromAccountId && toAccountId) {
          errors.push({
            field: 'toAccountId',
            message: 'Cannot specify both From Account and To Account',
          });
        }

        // Validate correct pairing: asset liquidation (asset → account) or asset purchase (account → asset)
        if (fromAssetId && fromAccountId) {
          errors.push({
            field: 'fromAccountId',
            message: 'Asset liquidation requires From Asset and To Account',
          });
        }
        if (toAssetId && toAccountId) {
          errors.push({
            field: 'toAccountId',
            message: 'Asset purchase requires From Account and To Asset',
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
    return !transactions.some((t) => t.fromAccountId === accountId || t.toAccountId === accountId);
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
