import { useFormState } from '../primitives/useFormState';
import { useAccountService } from '../useServices';
import type { AccountFormData } from '@/services/account.service';
import type { Account } from '@/types/models';
import { AccountType, CurrencyCode } from '@/types/enums';

interface UseAccountFormProps {
  account?: Account;
  onSubmit?: (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

/**
 * Domain hook for account form management
 * Wraps useFormState primitive with account-specific validation and transformation
 */
export function useAccountForm({ account, onSubmit }: UseAccountFormProps = {}) {
  const accountService = useAccountService();

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

  // Custom validation function
  const validate = (data: AccountFormData) => {
    const errors = accountService.validateAccountForm(data);
    // Convert service errors array to Record format
    return errors.reduce(
      (acc, err) => {
        acc[err.field] = err.message;
        return acc;
      },
      {} as Partial<Record<keyof AccountFormData, string>>
    );
  };

  // Use primitive form state hook
  const formState = useFormState<AccountFormData>(initialData, validate);

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
      const accountData = accountService.transformFormToAccount(formState.formData);

      if (account) {
        // Edit mode
        await accountService.update(account.id, accountData);
      } else {
        // Create mode
        await accountService.create(accountData);
      }

      if (onSubmit) {
        await onSubmit(accountData);
      }
    } finally {
      formState.setIsSubmitting(false);
    }
  };

  return {
    ...formState,
    handleSubmit,
    isEditMode: !!account,
  };
}
