import { renderHook, act } from '@testing-library/react';
import { useTransactionDialog } from './useTransactionDialog';
import type { Transaction } from '@/types/models';

describe('useTransactionDialog', () => {
  const mockTransaction: Transaction = {
    id: 'tx-1',
    date: '2024-01-15',
    description: 'Test transaction',
    amount: 100,
    transactionTypeId: 'type-1',
    fromAccountId: 'acc-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isDeleted: false,
  };

  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useTransactionDialog());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedItem).toBeNull();
  });

  it('should open dialog for creating new transaction', () => {
    const { result } = renderHook(() => useTransactionDialog());

    act(() => {
      result.current.openCreate();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toBeNull();
  });

  it('should open dialog for editing transaction', () => {
    const { result } = renderHook(() => useTransactionDialog());

    act(() => {
      result.current.openEdit(mockTransaction);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toEqual(mockTransaction);
  });

  it('should close dialog and clear selected item after delay', async () => {
    const { result } = renderHook(() => useTransactionDialog());

    act(() => {
      result.current.openEdit(mockTransaction);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toEqual(mockTransaction);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);

    // selectedItem is cleared after a 300ms delay
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(result.current.selectedItem).toBeNull();
  });
});
