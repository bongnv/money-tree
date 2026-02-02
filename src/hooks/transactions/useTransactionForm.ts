import { useState, useCallback } from 'react';
import { getTodayDate } from '@/utils/date.utils';
import {
  validateTransactionForm,
  transformFormToTransaction,
  type TransactionFormData,
} from '@/utils/transaction.utils';
import type { Transaction } from '@/types/models';

interface UseTransactionFormProps {
  transaction?: Transaction;
  onSubmit?: (
    transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => Promise<void>;
}

/**
 * Domain hook for transaction form management
 * Manages form state with transaction-specific validation and transformation
 */
export function useTransactionForm({ transaction, onSubmit }: UseTransactionFormProps = {}) {
  // Initialize form data from transaction (edit mode) or defaults (create mode)
  const initialData: TransactionFormData = transaction
    ? {
        date: transaction.date,
        transactionTypeId: transaction.transactionTypeId,
        description: transaction.description || '',
        amount: transaction.amount.toString(),
        fromAccountId: transaction.fromAccountId || '',
        toAccountId: transaction.toAccountId || '',
        fromAssetId: transaction.fromAssetId || '',
        toAssetId: transaction.toAssetId || '',
      }
    : {
        date: getTodayDate(),
        transactionTypeId: '',
        description: '',
        amount: '',
        fromAccountId: '',
        toAccountId: '',
        fromAssetId: '',
        toAssetId: '',
      };

  const [formData, setFormData] = useState<TransactionFormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormData, string>>>({});

  // Custom validation function
  const validate = useCallback((data: TransactionFormData) => {
    const validationErrors = validateTransactionForm(data);
    // Convert service errors array to Record format
    return validationErrors.reduce(
      (acc, err) => {
        acc[err.field as keyof TransactionFormData] = err.message;
        return acc;
      },
      {} as Partial<Record<keyof TransactionFormData, string>>
    );
  }, []);

  const setField = useCallback(
    <K extends keyof TransactionFormData>(field: K, value: TransactionFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Custom submit handler
  const handleSubmit = async () => {
    // Validate before submit
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const transactionData = transformFormToTransaction(formData);

    if (onSubmit) {
      await onSubmit(transactionData);
    }
  };

  return {
    formData,
    errors,
    setField,
    handleSubmit,
  };
}
