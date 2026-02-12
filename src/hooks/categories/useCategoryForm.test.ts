import { renderHook, act } from '@testing-library/react';
import type { Category } from '@/types/models';
import { useCategoryForm } from './useCategoryForm';

describe('useCategoryForm', () => {
  const mockCategory: Category = {
    id: 'category-1',
    name: 'Test Category',
    description: 'Test description',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('initialization', () => {
    it('should initialize with default values in create mode', () => {
      const { result } = renderHook(() => useCategoryForm());

      expect(result.current.formData).toEqual({
        name: '',
      });
      expect(result.current.errors).toEqual({});
    });

    it('should initialize with category values in edit mode', () => {
      const { result } = renderHook(() => useCategoryForm({ category: mockCategory }));

      expect(result.current.formData).toEqual({
        name: 'Test Category',
      });
    });
  });

  describe('setField', () => {
    it('should update field value', async () => {
      const { result } = renderHook(() => useCategoryForm());

      await act(async () => {
        result.current.setField('name', 'New Category');
      });

      expect(result.current.formData.name).toBe('New Category');
    });

    it('should clear field error when field is updated', async () => {
      const { result } = renderHook(() => useCategoryForm());

      // Trigger validation error by submitting empty form
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.name).toBeDefined();

      // Update the field
      await act(async () => {
        result.current.setField('name', 'Valid Name');
      });

      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('handleSubmit', () => {
    it('should validate form before submit', async () => {
      const mockSubmit = jest.fn();
      const { result } = renderHook(() => useCategoryForm({ onSubmit: mockSubmit }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.name).toBeDefined();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('should call onSubmit with valid data', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useCategoryForm({ onSubmit: mockSubmit }));

      await act(async () => {
        result.current.setField('name', 'Test Category');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Test Category',
      });
    });

    it('should handle submit without onSubmit callback', async () => {
      const { result } = renderHook(() => useCategoryForm());

      await act(async () => {
        result.current.setField('name', 'Test Category');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Should not throw error
      expect(result.current.errors).toEqual({});
    });

    it('should trim whitespace from name', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useCategoryForm({ onSubmit: mockSubmit }));

      await act(async () => {
        result.current.setField('name', '  Test Category  ');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Test Category',
      });
    });

    it('should reject empty name after trim', async () => {
      const mockSubmit = jest.fn();
      const { result } = renderHook(() => useCategoryForm({ onSubmit: mockSubmit }));

      await act(async () => {
        result.current.setField('name', '   ');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.name).toBeDefined();
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should clear error when field is fixed', async () => {
      const { result } = renderHook(() => useCategoryForm());

      // Generate errors
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.name).toBeDefined();

      // Fix the name error
      await act(async () => {
        result.current.setField('name', 'Valid Name');
      });

      expect(result.current.errors.name).toBeUndefined();
    });
  });
});
