import { useFormState } from '../primitives/useFormState';
import { useCategoryService } from '../useServices';
import type { CategoryFormData } from '@/services/category.service';
import type { Category } from '@/types/models';

interface UseCategoryFormProps {
  category?: Category;
  onSubmit?: (
    categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => Promise<void>;
}

/**
 * Domain hook for category form management
 * Wraps useFormState primitive with category-specific validation and transformation
 */
export function useCategoryForm({ category, onSubmit }: UseCategoryFormProps = {}) {
  const categoryService = useCategoryService();

  // Initialize form data from category (edit mode) or defaults (create mode)
  const initialData: CategoryFormData = category
    ? {
        name: category.name,
      }
    : {
        name: '',
      };

  // Custom validation function
  const validate = (data: CategoryFormData) => {
    const errors = categoryService.validateCategoryForm(data);
    // Convert service errors array to Record format
    return errors.reduce(
      (acc, err) => {
        acc[err.field] = err.message;
        return acc;
      },
      {} as Partial<Record<keyof CategoryFormData, string>>
    );
  };

  // Use primitive form state hook
  const formState = useFormState<CategoryFormData>(initialData, validate);

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
      const categoryData = categoryService.transformFormToCategory(formState.formData);

      if (category) {
        // Edit mode
        await categoryService.update(category.id, categoryData);
      } else {
        // Create mode
        await categoryService.create(categoryData);
      }

      if (onSubmit) {
        await onSubmit(categoryData);
      }
    } finally {
      formState.setIsSubmitting(false);
    }
  };

  return {
    ...formState,
    handleSubmit,
    isEditMode: !!category,
  };
}
