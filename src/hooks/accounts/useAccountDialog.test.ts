import { renderHook, act } from '@testing-library/react';
import { useAccountDialog } from './useAccountDialog';
import type { Account } from '@/types/models';
import { AccountType, CurrencyCode } from '@/types/enums';

describe('useAccountDialog', () => {
  const mockAccount: Account = {
    id: 'account-1',
    name: 'Test Account',
    type: AccountType.BANK_ACCOUNT,
    currencyCode: CurrencyCode.USD,
    initialBalance: 1000,
    isActive: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useAccountDialog());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedItem).toBe(null);
  });

  it('should open dialog in create mode', () => {
    const { result } = renderHook(() => useAccountDialog());

    act(() => {
      result.current.openCreate();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toBe(null);
  });

  it('should open dialog in edit mode with account', () => {
    const { result } = renderHook(() => useAccountDialog());

    act(() => {
      result.current.openEdit(mockAccount);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toBe(mockAccount);
  });

  it('should close dialog immediately', () => {
    const { result } = renderHook(() => useAccountDialog());

    act(() => {
      result.current.openEdit(mockAccount);
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should clear selected item after delay when closing', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useAccountDialog());

    act(() => {
      result.current.openEdit(mockAccount);
    });

    expect(result.current.selectedItem).toBe(mockAccount);

    act(() => {
      result.current.close();
    });

    // Should still have item immediately after close
    expect(result.current.selectedItem).toBe(mockAccount);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should clear item after timeout
    expect(result.current.selectedItem).toBe(null);

    jest.useRealTimers();
  });

  it('should handle multiple open/close cycles', () => {
    const { result } = renderHook(() => useAccountDialog());

    // First cycle - create
    act(() => {
      result.current.openCreate();
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toBe(null);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);

    // Second cycle - edit
    act(() => {
      result.current.openEdit(mockAccount);
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toBe(mockAccount);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should maintain stable callback references', () => {
    const { result, rerender } = renderHook(() => useAccountDialog());

    const initialOpenCreate = result.current.openCreate;
    const initialOpenEdit = result.current.openEdit;
    const initialClose = result.current.close;

    rerender();

    expect(result.current.openCreate).toBe(initialOpenCreate);
    expect(result.current.openEdit).toBe(initialOpenEdit);
    expect(result.current.close).toBe(initialClose);
  });
});
