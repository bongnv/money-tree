import { useState, useCallback } from 'react';
import {
  validateCategoryForm,
  transformFormToCategory,
  type CategoryFormData,
} from '@/utils/category.utils';
import type { Category } from '@/types/models';

interface UseCategoryFormProps {
  category?: Category;
  onSubmit?: (
    categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => Promise<void>;
}

/**
 * Domain hook for category form management
 * Manages form state with category-specific validation and transformation
 */
export function useCategoryForm({ category, onSubmit }: UseCategoryFormProps = {}) {
  // Initialize form data from category (edit mode) or defaults (create mode)
  const initialData: CategoryFormData = category
    ? {
        name: category.name,
      }
    : {
        name: '',
      };

  const [formData, setFormData] = useState<CategoryFormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({});

  // Custom validation function
  const validate = useCallback((data: CategoryFormData) => {
    const validationErrors = validateCategoryForm(data);
    // Convert service errors array to Record format
    return validationErrors.reduce(
      (acc, err) => {
        acc[err.field] = err.message;
        return acc;
      },
      {} as Partial<Record<keyof CategoryFormData, string>>
    );
  }, []);

  const setField = useCallback(
    <K extends keyof CategoryFormData>(field: K, value: CategoryFormData[K]) => {
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

    const categoryData = transformFormToCategory(formData);

    if (onSubmit) {
      await onSubmit(categoryData);
    }
  };

  return {
    formData,
    errors,
    setField,
    handleSubmit,
  };
}
