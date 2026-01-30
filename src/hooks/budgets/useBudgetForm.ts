import { useFormState } from '../primitives/useFormState';
import { useBudgetService } from '../useServices';
import type { BudgetFormData } from '@/services/budget.service';
import type { Budget } from '@/types/models';
import { BudgetPeriod, CurrencyCode } from '@/types/enums';

interface UseBudgetFormProps {
  budget?: Budget;
  onSubmit?: (budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => Promise<void>;
}

/**
 * Domain hook for budget form management
 * Wraps useFormState primitive with budget-specific validation and transformation
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

  // Custom validation function
  const validate = (data: BudgetFormData) => {
    const errors = budgetService.validateBudgetForm(data);
    // Convert service errors array to Record format
    return errors.reduce(
      (acc, err) => {
        acc[err.field] = err.message;
        return acc;
      },
      {} as Partial<Record<keyof BudgetFormData, string>>
    );
  };

  // Use primitive form state hook
  const formState = useFormState<BudgetFormData>(initialData, validate);

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
      const budgetData = budgetService.transformFormToBudget(formState.formData);
      
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
      formState.setIsSubmitting(false);
    }
  };

  return {
    ...formState,
    handleSubmit,
    isEditMode: !!budget,
  };
}
