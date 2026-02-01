import { useState, useCallback } from 'react';
import { useBudgetService } from '../useServices';
import type { BudgetFormData } from '@/services/budget.service';
import type { Budget } from '@/types/models';
import { BudgetPeriod, CurrencyCode } from '@/types/enums';

interface UseBudgetFormProps {
  budget?: Budget;
  onSubmit?: (
    budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => Promise<void>;
}

/**
 * Domain hook for budget form management
 * Manages form state with budget-specific validation and transformation
 */
export function useBudgetForm({ budget, onSubmit }: UseBudgetFormProps = {}) {
  const budgetService = useBudgetService();

  // Initialize form data from budget (edit mode) or defaults (create mode)
  const initialData: BudgetFormData = budget
    ? {
        transactionTypeId: budget.transactionTypeId,
        amount: budget.amount.toString(),
        currencyCode: budget.currencyCode,
        period: budget.period,
        startDate: budget.startDate,
        endDate: budget.endDate,
      }
    : {
        transactionTypeId: '',
        amount: '',
        currencyCode: CurrencyCode.USD,
        period: BudgetPeriod.MONTHLY,
        startDate: '',
        endDate: '',
      };

  const [formData, setFormData] = useState<BudgetFormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof BudgetFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom validation function
  const validate = useCallback(
    (data: BudgetFormData) => {
      const validationErrors = budgetService.validateBudgetForm(data);
      // Convert service errors array to Record format
      return validationErrors.reduce(
        (acc, err) => {
          acc[err.field] = err.message;
          return acc;
        },
        {} as Partial<Record<keyof BudgetFormData, string>>
      );
    },
    [budgetService]
  );

  const setField = useCallback(
    <K extends keyof BudgetFormData>(field: K, value: BudgetFormData[K]) => {
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
      const budgetData = budgetService.transformFormToBudget(formData);

      if (budget) {
        // Edit mode
        await budgetService.update(budget.id, budgetData);
      } else {
        // Create mode
        await budgetService.create(budgetData);
      }

      if (onSubmit) {
        await onSubmit(budgetData);
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
