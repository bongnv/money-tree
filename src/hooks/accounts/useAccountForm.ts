import { useState, useCallback } from 'react';
import {
  validateAccountForm,
  transformFormToAccount,
  type AccountFormData,
} from '@/utils/account.utils';
import type { Account } from '@/types/models';
import { AccountType, CurrencyCode } from '@/types/enums';

interface UseAccountFormProps {
  account?: Account;
  onSubmit?: (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

/**
 * Domain hook for account form management
 * Manages form state with account-specific validation and transformation
 */
export function useAccountForm({ account, onSubmit }: UseAccountFormProps = {}) {
  // Initialize form data from account (edit mode) or defaults (create mode)
  const initialData: AccountFormData = account
    ? {
        name: account.name,
        type: account.type,
        currencyCode: account.currencyCode,
        initialBalance: account.initialBalance.toString(),
        description: account.description,
        isActive: account.isActive,
      }
    : {
        name: '',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '0',
        isActive: true,
      };

  const [formData, setFormData] = useState<AccountFormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof AccountFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom validation function
  const validate = useCallback((data: AccountFormData) => {
    const validationErrors = validateAccountForm(data);
    // Convert service errors array to Record format
    return validationErrors.reduce(
      (acc, err) => {
        acc[err.field] = err.message;
        return acc;
      },
      {} as Partial<Record<keyof AccountFormData, string>>
    );
  }, []);

  const setField = useCallback(
    <K extends keyof AccountFormData>(field: K, value: AccountFormData[K]) => {
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

    setIsSubmitting(true);
    try {
      const accountData = transformFormToAccount(formData);

      if (onSubmit) {
        await onSubmit(accountData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    errors,
    isSubmitting,
    setField,
    handleSubmit,
  };
}
