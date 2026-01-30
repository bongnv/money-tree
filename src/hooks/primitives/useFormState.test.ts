import { renderHook, act } from '@testing-library/react';
import { useFormState } from './useFormState';

describe('useFormState', () => {
  interface TestFormData {
    name: string;
    email: string;
    age: number;
  }

  const initialData: TestFormData = {
    name: '',
    email: '',
    age: 0,
  };

  const validateForm = (data: TestFormData): Partial<Record<keyof TestFormData, string>> => {
    const errors: Partial<Record<keyof TestFormData, string>> = {};
    if (!data.name) errors.name = 'Name is required';
    if (!data.email) errors.email = 'Email is required';
    if (data.email && !data.email.includes('@')) errors.email = 'Email must be valid';
    if (data.age < 0) errors.age = 'Age must be positive';
    return errors;
  };

  describe('initialization', () => {
    it('should initialize with provided data', () => {
      const { result } = renderHook(() => useFormState(initialData));

      expect(result.current.formData).toEqual(initialData);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isDirty).toBe(false);
    });

    it('should initialize with validator function', () => {
      const { result } = renderHook(() => useFormState(initialData, validateForm));

      expect(result.current.formData).toEqual(initialData);
      expect(result.current.errors).toEqual({});
    });
  });

  describe('setField', () => {
    it('should update a single field', () => {
      const { result } = renderHook(() => useFormState(initialData));

      act(() => {
        result.current.setField('name', 'John Doe');
      });

      expect(result.current.formData.name).toBe('John Doe');
      expect(result.current.isDirty).toBe(true);
    });

    it('should clear error when field value changes', () => {
      const { result } = renderHook(() => useFormState(initialData, validateForm));

      // First validate to set errors
      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors.name).toBe('Name is required');

      // Then update field
      act(() => {
        result.current.setField('name', 'John');
      });

      expect(result.current.errors.name).toBeUndefined();
    });

    it('should not clear errors for other fields', () => {
      const { result } = renderHook(() => useFormState(initialData, validateForm));

      // Validate to set multiple errors
      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors.name).toBeDefined();
      expect(result.current.errors.email).toBeDefined();

      // Update only name field
      act(() => {
        result.current.setField('name', 'John');
      });

      expect(result.current.errors.name).toBeUndefined();
      expect(result.current.errors.email).toBeDefined();
    });
  });

  describe('setFields', () => {
    it('should update multiple fields at once', () => {
      const { result } = renderHook(() => useFormState(initialData));

      act(() => {
        result.current.setFields({ name: 'John', email: 'john@example.com' });
      });

      expect(result.current.formData.name).toBe('John');
      expect(result.current.formData.email).toBe('john@example.com');
      expect(result.current.isDirty).toBe(true);
    });

    it('should partially update form data', () => {
      const { result } = renderHook(() => useFormState({ ...initialData, name: 'Jane' }));

      act(() => {
        result.current.setFields({ email: 'jane@example.com' });
      });

      expect(result.current.formData.name).toBe('Jane');
      expect(result.current.formData.email).toBe('jane@example.com');
    });
  });

  describe('setFieldTouched', () => {
    it('should mark a field as touched', () => {
      const { result } = renderHook(() => useFormState(initialData));

      act(() => {
        result.current.setFieldTouched('name');
      });

      expect(result.current.touched.name).toBe(true);
    });

    it('should mark a field as not touched', () => {
      const { result } = renderHook(() => useFormState(initialData));

      act(() => {
        result.current.setFieldTouched('name', true);
        result.current.setFieldTouched('name', false);
      });

      expect(result.current.touched.name).toBe(false);
    });
  });

  describe('validateForm', () => {
    it('should return true when no validator is provided', () => {
      const { result } = renderHook(() => useFormState(initialData));

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('should return false when validation fails', () => {
      const { result } = renderHook(() => useFormState(initialData, validateForm));

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors).toEqual({
        name: 'Name is required',
        email: 'Email is required',
      });
    });

    it('should return true when validation passes', () => {
      const validData: TestFormData = {
        name: 'John',
        email: 'john@example.com',
        age: 25,
      };
      const { result } = renderHook(() => useFormState(validData, validateForm));

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('should validate based on current form data', () => {
      const { result } = renderHook(() => useFormState(initialData, validateForm));

      act(() => {
        result.current.setFields({ name: 'John', email: 'invalid-email' });
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors).toEqual({
        email: 'Email must be valid',
      });
    });
  });

  describe('reset', () => {
    it('should reset form to initial state', () => {
      const { result } = renderHook(() => useFormState(initialData, validateForm));

      // Make changes
      act(() => {
        result.current.setFields({ name: 'John', email: 'john@example.com' });
        result.current.setFieldTouched('name');
        result.current.validateForm();
        result.current.setIsSubmitting(true);
      });

      expect(result.current.isDirty).toBe(true);
      expect(result.current.isSubmitting).toBe(true);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.formData).toEqual(initialData);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isDirty).toBe(false);
    });

    it('should reset to new initial data if provided', () => {
      const { result } = renderHook(() => useFormState(initialData));

      const newData: TestFormData = {
        name: 'Jane',
        email: 'jane@example.com',
        age: 30,
      };

      act(() => {
        result.current.setField('name', 'John');
        result.current.reset(newData);
      });

      expect(result.current.formData).toEqual(newData);
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('setFieldError', () => {
    it('should set an error for a specific field', () => {
      const { result } = renderHook(() => useFormState(initialData));

      act(() => {
        result.current.setFieldError('name', 'Custom error');
      });

      expect(result.current.errors.name).toBe('Custom error');
    });

    it('should overwrite existing error', () => {
      const { result } = renderHook(() => useFormState(initialData, validateForm));

      act(() => {
        result.current.validateForm();
        result.current.setFieldError('name', 'New custom error');
      });

      expect(result.current.errors.name).toBe('New custom error');
    });
  });

  describe('getFieldError', () => {
    it('should return error only if field is touched', () => {
      const { result } = renderHook(() => useFormState(initialData, validateForm));

      act(() => {
        result.current.validateForm();
      });

      // Not touched - should return undefined
      expect(result.current.getFieldError('name')).toBeUndefined();

      // Touch the field
      act(() => {
        result.current.setFieldTouched('name');
      });

      // Now should return the error
      expect(result.current.getFieldError('name')).toBe('Name is required');
    });

    it('should return undefined if no error exists', () => {
      const { result } = renderHook(() => useFormState(initialData));

      act(() => {
        result.current.setFieldTouched('name');
      });

      expect(result.current.getFieldError('name')).toBeUndefined();
    });
  });

  describe('setIsSubmitting', () => {
    it('should update isSubmitting state', () => {
      const { result } = renderHook(() => useFormState(initialData));

      expect(result.current.isSubmitting).toBe(false);

      act(() => {
        result.current.setIsSubmitting(true);
      });

      expect(result.current.isSubmitting).toBe(true);

      act(() => {
        result.current.setIsSubmitting(false);
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('setErrors', () => {
    it('should set multiple errors at once', () => {
      const { result } = renderHook(() => useFormState(initialData));

      const errors = {
        name: 'Name error',
        email: 'Email error',
      };

      act(() => {
        result.current.setErrors(errors);
      });

      expect(result.current.errors).toEqual(errors);
    });

    it('should overwrite existing errors', () => {
      const { result } = renderHook(() => useFormState(initialData, validateForm));

      act(() => {
        result.current.validateForm();
        result.current.setErrors({ age: 'Age error' });
      });

      expect(result.current.errors).toEqual({ age: 'Age error' });
    });
  });

  describe('complex scenarios', () => {
    it('should handle full form submission workflow', () => {
      const { result } = renderHook(() => useFormState(initialData, validateForm));

      // User fills form
      act(() => {
        result.current.setField('name', 'John');
        result.current.setField('email', 'john@example.com');
        result.current.setField('age', 25);
      });

      expect(result.current.isDirty).toBe(true);

      // Mark fields as touched
      act(() => {
        result.current.setFieldTouched('name');
        result.current.setFieldTouched('email');
        result.current.setFieldTouched('age');
      });

      // Validate before submit
      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(true);

      // Submit
      act(() => {
        result.current.setIsSubmitting(true);
      });

      expect(result.current.isSubmitting).toBe(true);

      // After submission
      act(() => {
        result.current.setIsSubmitting(false);
        result.current.reset();
      });

      expect(result.current.formData).toEqual(initialData);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isDirty).toBe(false);
    });

    it('should handle validation errors during submission', () => {
      const { result } = renderHook(() => useFormState(initialData, validateForm));

      // Try to submit without filling required fields
      let isValid: boolean = true;
      act(() => {
        result.current.setFieldTouched('name');
        result.current.setFieldTouched('email');
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.getFieldError('name')).toBe('Name is required');
      expect(result.current.getFieldError('email')).toBe('Email is required');
    });

    it('should handle progressive validation as user types', () => {
      const { result } = renderHook(() => useFormState(initialData, validateForm));

      // User starts typing email
      act(() => {
        result.current.setField('email', 'invalid');
        result.current.setFieldTouched('email');
      });

      // Validate
      act(() => {
        result.current.validateForm();
      });

      expect(result.current.getFieldError('email')).toBe('Email must be valid');

      // User fixes email
      act(() => {
        result.current.setField('email', 'valid@example.com');
      });

      // Error should be cleared immediately
      expect(result.current.errors.email).toBeUndefined();

      // User also fills in name
      act(() => {
        result.current.setField('name', 'John');
      });

      // Revalidate shows no errors
      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.email).toBeUndefined();
    });
  });
});
