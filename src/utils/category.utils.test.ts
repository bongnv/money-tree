import { validateCategoryForm, transformFormToCategory } from './category.utils';
import type { CategoryFormData } from './category.utils';

describe('category.utils', () => {
  describe('validateCategoryForm', () => {
    const validFormData: CategoryFormData = {
      name: 'Food',
      description: 'Food and groceries',
    };

    it('should return no errors for valid form data', () => {
      const errors = validateCategoryForm(validFormData);
      expect(errors).toEqual([]);
    });

    it('should return error when name is empty', () => {
      const formData = { ...validFormData, name: '' };
      const errors = validateCategoryForm(formData);
      expect(errors).toContainEqual({
        field: 'name',
        message: 'Category name is required',
      });
    });

    it('should return error when name is only whitespace', () => {
      const formData = { ...validFormData, name: '   ' };
      const errors = validateCategoryForm(formData);
      expect(errors).toContainEqual({
        field: 'name',
        message: 'Category name is required',
      });
    });

    it('should accept form data without description', () => {
      const formData: CategoryFormData = {
        name: 'Transport',
      };
      const errors = validateCategoryForm(formData);
      expect(errors).toEqual([]);
    });
  });

  describe('transformFormToCategory', () => {
    it('should transform valid form data to Category entity', () => {
      const formData: CategoryFormData = {
        name: 'Entertainment',
        description: 'Movies, concerts, etc.',
      };

      const result = transformFormToCategory(formData);

      expect(result).toEqual({
        name: 'Entertainment',
        description: 'Movies, concerts, etc.',
      });
    });

    it('should trim name', () => {
      const formData: CategoryFormData = {
        name: '  Food  ',
        description: 'Groceries',
      };

      const result = transformFormToCategory(formData);

      expect(result.name).toBe('Food');
    });

    it('should trim description if provided', () => {
      const formData: CategoryFormData = {
        name: 'Shopping',
        description: '  Clothes and accessories  ',
      };

      const result = transformFormToCategory(formData);

      expect(result.description).toBe('Clothes and accessories');
    });

    it('should set description to undefined if empty after trim', () => {
      const formData: CategoryFormData = {
        name: 'Shopping',
        description: '   ',
      };

      const result = transformFormToCategory(formData);

      expect(result.description).toBeUndefined();
    });

    it('should set description to undefined if not provided', () => {
      const formData: CategoryFormData = {
        name: 'Travel',
      };

      const result = transformFormToCategory(formData);

      expect(result.description).toBeUndefined();
    });
  });
});
