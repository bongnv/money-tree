import type { Transaction, Account, TransactionType } from '@/types/models';
import { Group } from '@/types/enums';

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
   * @param fromAccount From account (if applicable)
   * @param toAccount To account (if applicable)
   * @returns Array of validation errors
   */
  validateTransaction(
    transaction: Partial<Transaction>,
    transactionType?: TransactionType,
    fromAccount?: Account,
    toAccount?: Account
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

    // Validate accounts based on group from transactionType
    if (transactionType) {
      const accountErrors = this.validateAccountsByGroup(
        transactionType.group,
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

      case Group.ASSET_PURCHASE:
        // Account → Asset
        if (!fromAccountId) {
          errors.push({
            field: 'fromAccountId',
            message: 'From account is required for asset purchases',
          });
        }
        if (!toAssetId) {
          errors.push({
            field: 'toAssetId',
            message: 'To asset is required for asset purchases',
          });
        }
        if (toAccountId) {
          errors.push({
            field: 'toAccountId',
            message: 'To account should not be set for asset purchases',
          });
        }
        if (fromAssetId) {
          errors.push({
            field: 'fromAssetId',
            message: 'From asset should not be set for asset purchases',
          });
        }
        break;

      case Group.ASSET_SALE:
        // Asset → Account
        if (!fromAssetId) {
          errors.push({
            field: 'fromAssetId',
            message: 'From asset is required for asset sales',
          });
        }
        if (!toAccountId) {
          errors.push({
            field: 'toAccountId',
            message: 'To account is required for asset sales',
          });
        }
        if (fromAccountId) {
          errors.push({
            field: 'fromAccountId',
            message: 'From account should not be set for asset sales',
          });
        }
        if (toAssetId) {
          errors.push({
            field: 'toAssetId',
            message: 'To asset should not be set for asset sales',
          });
        }
        break;
    }

    return errors;
  }
}

export const validationService = new ValidationService();
