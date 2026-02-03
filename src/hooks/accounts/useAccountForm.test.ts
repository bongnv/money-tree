import { renderHook, act, waitFor } from '@testing-library/react';
import { useAccountForm } from './useAccountForm';
import type { Account } from '@/types/models';
import { AccountType, CurrencyCode } from '@/types/enums';

describe('useAccountForm', () => {
  const mockAccount: Account = {
    id: 'account-1',
    name: 'Test Account',
    type: AccountType.BANK_ACCOUNT,
    currencyCode: CurrencyCode.USD,
    initialBalance: 1000,
    description: 'Test description',
    isActive: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('initialization', () => {
    it('should initialize with default values in create mode', () => {
      const { result } = renderHook(() => useAccountForm());

      expect(result.current.formData).toEqual({
        name: '',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '0',
        isActive: true,
      });
      expect(result.current.errors).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should initialize with account values in edit mode', () => {
      const { result } = renderHook(() => useAccountForm({ account: mockAccount }));

      expect(result.current.formData).toEqual({
        name: 'Test Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '1000',
        description: 'Test description',
        isActive: true,
      });
    });
  });

  describe('setField', () => {
    it('should update field value', () => {
      const { result } = renderHook(() => useAccountForm());

      act(() => {
        result.current.setField('name', 'New Account');
      });

      expect(result.current.formData.name).toBe('New Account');
    });

    it('should update multiple fields independently', () => {
      const { result } = renderHook(() => useAccountForm());

      act(() => {
        result.current.setField('name', 'New Account');
      });

      act(() => {
        result.current.setField('type', AccountType.CREDIT_CARD);
      });

      act(() => {
        result.current.setField('currencyCode', CurrencyCode.SGD);
      });

      expect(result.current.formData.name).toBe('New Account');
      expect(result.current.formData.type).toBe(AccountType.CREDIT_CARD);
      expect(result.current.formData.currencyCode).toBe(CurrencyCode.SGD);
    });

    it('should clear field error when field is updated', () => {
      const { result } = renderHook(() => useAccountForm());

      // Trigger validation error by submitting empty form
      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.name).toBeDefined();

      // Update the field
      act(() => {
        result.current.setField('name', 'Valid Name');
      });

      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('handleSubmit', () => {
    it('should validate form before submit', async () => {
      const mockSubmit = jest.fn();
      const { result } = renderHook(() => useAccountForm({ onSubmit: mockSubmit }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.name).toBeDefined();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('should call onSubmit with valid data', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAccountForm({ onSubmit: mockSubmit }));

      act(() => {
        result.current.setField('name', 'Test Account');
      });

      act(() => {
        result.current.setField('initialBalance', '500');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Test Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: 500,
        isActive: true,
        isDeleted: false,
      });
    });

    it('should set isSubmitting during submit', async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      const mockSubmit = jest.fn().mockReturnValue(submitPromise);

      const { result } = renderHook(() => useAccountForm({ onSubmit: mockSubmit }));

      // Set name in initial render to avoid callback instability
      await act(async () => {
        result.current.setField('name', 'Test Account');
      });

      // Start submit
      let submitComplete: Promise<void>;
      act(() => {
        submitComplete = result.current.handleSubmit();
      });

      // Should be submitting
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      // Resolve the submit
      resolveSubmit!();
      await act(async () => {
        await submitComplete!;
      });

      // Should no longer be submitting
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle submit without onSubmit callback', async () => {
      const { result } = renderHook(() => useAccountForm());

      await act(async () => {
        result.current.setField('name', 'Test Account');
        await result.current.handleSubmit();
      });

      // Should not throw error
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should reset isSubmitting even on error', async () => {
      const mockSubmit = jest.fn().mockRejectedValue(new Error('Submit failed'));
      const { result } = renderHook(() => useAccountForm({ onSubmit: mockSubmit }));

      await act(async () => {
        result.current.setField('name', 'Test Account');
        try {
          await result.current.handleSubmit();
        } catch {
          // Expected error
        }
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle description field', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAccountForm({ onSubmit: mockSubmit }));

      await act(async () => {
        result.current.setField('name', 'Test Account');
      });

      await act(async () => {
        result.current.setField('description', 'My account description');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'My account description',
        })
      );
    });

    it('should handle isActive field', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAccountForm({ onSubmit: mockSubmit }));

      await act(async () => {
        result.current.setField('name', 'Test Account');
      });

      await act(async () => {
        result.current.setField('isActive', false);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        })
      );
    });

    it('should validate initialBalance as number', async () => {
      const mockSubmit = jest.fn();
      const { result } = renderHook(() => useAccountForm({ onSubmit: mockSubmit }));

      await act(async () => {
        result.current.setField('name', 'Test Account');
      });

      await act(async () => {
        result.current.setField('initialBalance', 'invalid');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.initialBalance).toBeDefined();
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should show errors for all invalid fields', async () => {
      const { result } = renderHook(() => useAccountForm());

      await act(async () => {
        result.current.setField('initialBalance', 'invalid');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.name).toBeDefined();
      expect(result.current.errors.initialBalance).toBeDefined();
    });

    it('should clear error when field is fixed', async () => {
      const { result } = renderHook(() => useAccountForm());

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
