/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { useTransactionForm } from './useTransactionForm';
import type { Transaction } from '@/types/models';

describe('useTransactionForm', () => {
  const mockTransaction: Transaction = {
    id: 'tx-1',
    date: '2024-03-15',
    transactionTypeId: 'type-1',
    description: 'Test transaction',
    amount: 150.5,
    fromAccountId: 'acc-1',
    toAccountId: 'acc-2',
    fromAssetId: 'asset-1',
    toAssetId: 'asset-2',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('initialization', () => {
    it('should initialize with default values when no transaction provided', () => {
      const { result } = renderHook(() => useTransactionForm());

      expect(result.current.formData.transactionTypeId).toBe('');
      expect(result.current.formData.description).toBe('');
      expect(result.current.formData.amount).toBe('');
      expect(result.current.formData.fromAccountId).toBe('');
      expect(result.current.formData.toAccountId).toBe('');
      expect(result.current.formData.fromAssetId).toBe('');
      expect(result.current.formData.toAssetId).toBe('');
      expect(result.current.formData.date).toBeDefined();
      expect(result.current.errors).toEqual({});
    });

    it('should initialize with transaction data in edit mode', () => {
      const { result } = renderHook(() => useTransactionForm({ transaction: mockTransaction }));

      expect(result.current.formData.date).toBe('2024-03-15');
      expect(result.current.formData.transactionTypeId).toBe('type-1');
      expect(result.current.formData.description).toBe('Test transaction');
      expect(result.current.formData.amount).toBe('150.5');
      expect(result.current.formData.fromAccountId).toBe('acc-1');
      expect(result.current.formData.toAccountId).toBe('acc-2');
      expect(result.current.formData.fromAssetId).toBe('asset-1');
      expect(result.current.formData.toAssetId).toBe('asset-2');
    });

    it('should handle transaction with no description', () => {
      const txWithoutDesc: Transaction = {
        ...mockTransaction,
        description: undefined as any,
      };

      const { result } = renderHook(() => useTransactionForm({ transaction: txWithoutDesc }));

      expect(result.current.formData.description).toBe('');
    });

    it('should handle transaction with no optional account/asset IDs', () => {
      const txMinimal: Transaction = {
        ...mockTransaction,
        fromAccountId: undefined as any,
        toAccountId: undefined as any,
        fromAssetId: undefined as any,
        toAssetId: undefined as any,
      };

      const { result } = renderHook(() => useTransactionForm({ transaction: txMinimal }));

      expect(result.current.formData.fromAccountId).toBe('');
      expect(result.current.formData.toAccountId).toBe('');
      expect(result.current.formData.fromAssetId).toBe('');
      expect(result.current.formData.toAssetId).toBe('');
    });
  });

  describe('setField', () => {
    it('should update a form field', () => {
      const { result } = renderHook(() => useTransactionForm());

      act(() => {
        result.current.setField('description', 'New description');
      });

      expect(result.current.formData.description).toBe('New description');
    });

    it('should update amount field', () => {
      const { result } = renderHook(() => useTransactionForm());

      act(() => {
        result.current.setField('amount', '250.75');
      });

      expect(result.current.formData.amount).toBe('250.75');
    });

    it('should clear error for field when setting a value', () => {
      const { result } = renderHook(() => useTransactionForm());

      // Submit to trigger validation errors
      act(() => {
        result.current.handleSubmit();
      });

      // Should have errors
      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

      // Set a field that had an error
      act(() => {
        result.current.setField('amount', '100');
      });

      // Error for amount should be cleared
      expect(result.current.errors.amount).toBeUndefined();
    });

    it('should not affect other errors when clearing one field error', () => {
      const { result } = renderHook(() => useTransactionForm());

      // Submit to trigger validation errors
      act(() => {
        result.current.handleSubmit();
      });

      const errorCount = Object.keys(result.current.errors).length;

      // Fix one field
      act(() => {
        result.current.setField('amount', '100');
      });

      // Other errors should still exist
      expect(Object.keys(result.current.errors).length).toBe(errorCount - 1);
    });
  });

  describe('handleSubmit', () => {
    it('should show validation errors on invalid submit', async () => {
      const { result } = renderHook(() => useTransactionForm());

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
    });

    it('should call onSubmit with transformed data when valid', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useTransactionForm({ transaction: mockTransaction, onSubmit })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2024-03-15',
          transactionTypeId: 'type-1',
          amount: 150.5,
        })
      );
    });

    it('should not call onSubmit when validation fails', async () => {
      const onSubmit = jest.fn();

      const { result } = renderHook(() => useTransactionForm({ onSubmit }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should work when no onSubmit callback is provided', async () => {
      const { result } = renderHook(() => useTransactionForm({ transaction: mockTransaction }));

      // Should not throw
      await act(async () => {
        await result.current.handleSubmit();
      });
    });
  });
});
