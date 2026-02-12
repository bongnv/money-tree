import { AccountType, CurrencyCode } from '@/types/enums';
import type { Account } from '@/types/models';

export interface AccountFormData {
  name: string;
  type: AccountType;
  currencyCode: CurrencyCode;
  initialBalance: string;
  description?: string;
  isActive: boolean;
}

export interface AccountValidationError {
  field: keyof AccountFormData;
  message: string;
}

/**
 * Validate account form data
 * @param formData Form data to validate
 * @returns Array of validation errors
 */
export function validateAccountForm(formData: AccountFormData): AccountValidationError[] {
  const errors: AccountValidationError[] = [];

  // Validate name
  if (!formData.name.trim()) {
    errors.push({ field: 'name', message: 'Account name is required' });
  }

  // Validate type
  if (!formData.type) {
    errors.push({ field: 'type', message: 'Account type is required' });
  }

  // Validate currency
  if (!formData.currencyCode) {
    errors.push({ field: 'currencyCode', message: 'Currency is required' });
  }

  // Validate initial balance is a number
  const balance = parseFloat(formData.initialBalance);
  if (isNaN(balance)) {
    errors.push({ field: 'initialBalance', message: 'Initial balance must be a valid number' });
  }

  return errors;
}

/**
 * Transform form data to Account entity
 * @param formData Form data to transform
 * @returns Account data ready for create/update
 */
export function transformFormToAccount(
  formData: AccountFormData
): Omit<Account, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: formData.name.trim(),
    type: formData.type,
    currencyCode: formData.currencyCode,
    initialBalance: parseFloat(formData.initialBalance),
    description: formData.description?.trim() || undefined,
    isActive: formData.isActive,
    isDeleted: false,
  };
}
