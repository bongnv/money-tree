import type { Category } from '@/types/models';

export interface CategoryFormData {
  name: string;
  description?: string;
}

export interface CategoryValidationError {
  field: keyof CategoryFormData;
  message: string;
}

/**
 * Validate category form data
 * @param formData Form data to validate
 * @returns Array of validation errors
 */
export function validateCategoryForm(formData: CategoryFormData): CategoryValidationError[] {
  const errors: CategoryValidationError[] = [];

  if (!formData.name.trim()) {
    errors.push({ field: 'name', message: 'Category name is required' });
  }

  return errors;
}

/**
 * Transform form data to Category entity
 * @param formData Form data to transform
 * @returns Category data ready for create/update
 */
export function transformFormToCategory(
  formData: CategoryFormData
): Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'> {
  return {
    name: formData.name.trim(),
    description: formData.description?.trim() || undefined,
  };
}
