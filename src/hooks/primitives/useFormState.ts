import { useState, useCallback } from 'react';

/**
 * Generic form state management hook
 * Handles form data, validation, errors, and submission state
 *
 * @template T - The type of the form data
 * @param initialData - Initial form data
 * @param validate - Optional validation function that returns errors
 * @returns Form state and handlers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFormState<T extends Record<string, any>>(
  initialData: T,
  validate?: (data: T) => Partial<Record<keyof T, string>>
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  /**
   * Update a single field value
   */
  const setField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);

      // Clear error for this field when user starts typing
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

  /**
   * Update multiple fields at once
   */
  const setFields = useCallback((updates: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  /**
   * Mark a field as touched (for validation on blur)
   */
  const setFieldTouched = useCallback((field: keyof T, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [field]: isTouched }));
  }, []);

  /**
   * Validate the current form data
   * @returns true if valid, false if there are errors
   */
  const validateForm = useCallback((): boolean => {
    if (!validate) return true;

    const validationErrors = validate(formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [formData, validate]);

  /**
   * Reset form to initial state
   */
  const reset = useCallback(
    (newInitialData?: T) => {
      setFormData(newInitialData || initialData);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
      setIsDirty(false);
    },
    [initialData]
  );

  /**
   * Set a specific error for a field
   */
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  /**
   * Check if a field has an error and has been touched
   */
  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      return touched[field] ? errors[field] : undefined;
    },
    [errors, touched]
  );

  return {
    // State
    formData,
    errors,
    touched,
    isSubmitting,
    isDirty,

    // Field handlers
    setField,
    setFields,
    setFieldTouched,
    setFieldError,
    getFieldError,

    // Form actions
    validateForm,
    reset,
    setIsSubmitting,
    setErrors,
  };
}
