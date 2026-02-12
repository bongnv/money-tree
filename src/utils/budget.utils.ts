import { BudgetPeriod, CurrencyCode } from '@/types/enums';
import type { Budget } from '@/types/models';

export interface BudgetFormData {
  transactionTypeId: string;
  amount: string;
  currencyCode: string;
  period: string;
  startDate: string;
  endDate: string;
}

export interface BudgetValidationError {
  field: keyof BudgetFormData;
  message: string;
}

/**
 * Validate budget form data
 * @param formData Form data to validate
 * @returns Array of validation errors
 */
export function validateBudgetForm(formData: BudgetFormData): BudgetValidationError[] {
  const errors: BudgetValidationError[] = [];

  if (!formData.transactionTypeId) {
    errors.push({ field: 'transactionTypeId', message: 'Transaction type is required' });
  }

  if (!formData.currencyCode) {
    errors.push({ field: 'currencyCode', message: 'Currency is required' });
  }

  const amount = parseFloat(formData.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
  }

  if (!formData.period) {
    errors.push({ field: 'period', message: 'Period is required' });
  }

  if (!formData.startDate) {
    errors.push({ field: 'startDate', message: 'Start date is required' });
  }

  if (!formData.endDate) {
    errors.push({ field: 'endDate', message: 'End date is required' });
  }

  if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
    errors.push({ field: 'endDate', message: 'End date must be on or after start date' });
  }

  return errors;
}

/**
 * Transform form data to Budget entity
 * @param formData Form data to transform
 * @returns Budget data ready for create/update
 */
export function transformFormToBudget(
  formData: BudgetFormData
): Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'> {
  return {
    transactionTypeId: formData.transactionTypeId,
    amount: parseFloat(formData.amount),
    currencyCode: formData.currencyCode as CurrencyCode,
    period: formData.period as BudgetPeriod,
    startDate: formData.startDate,
    endDate: formData.endDate,
  };
}
