import { getTodayDate } from '@/utils/date.utils';
import { useFormState } from '../primitives/useFormState';
import { useTransactionService } from '../useServices';
import type { TransactionFormData } from '@/services/transaction.service';
import type { Transaction } from '@/types/models';

interface UseTransactionFormProps {
  transaction?: Transaction;
  onSubmit?: (
    transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => Promise<void>;
}

/**
 * Domain hook for transaction form management
 * Wraps useFormState primitive with transaction-specific validation and transformation
 */
export function useTransactionForm({ transaction, onSubmit }: UseTransactionFormProps = {}) {
  const transactionService = useTransactionService();

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

  // Custom validation function
  const validate = (data: TransactionFormData) => {
    const errors = transactionService.validateTransactionForm(data);
    // Convert service errors array to Record format
    return errors.reduce(
      (acc, err) => {
        acc[err.field as keyof TransactionFormData] = err.message;
        return acc;
      },
      {} as Partial<Record<keyof TransactionFormData, string>>
    );
  };

  // Use primitive form state hook
  const formState = useFormState<TransactionFormData>(initialData, validate);

  // Custom submit handler
  const handleSubmit = async () => {
    // Validate before submit
    const errors = validate(formState.formData);
    if (Object.keys(errors).length > 0) {
      formState.setErrors(errors);
      return;
    }

    formState.setIsSubmitting(true);
    try {
      const transactionData = transactionService.transformFormToTransaction(formState.formData);

      if (transaction) {
        // Edit mode
        await transactionService.update(transaction.id, transactionData);
      } else {
        // Create mode
        await transactionService.create(transactionData);
      }

      if (onSubmit) {
        await onSubmit(transactionData);
      }
    } finally {
      formState.setIsSubmitting(false);
    }
  };

  return {
    ...formState,
    handleSubmit,
    isEditMode: !!transaction,
  };
}
