import { renderHook, act } from '@testing-library/react';
import { useConfirmDialog } from './useConfirmDialog';

describe('useConfirmDialog', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useConfirmDialog());

    expect(result.current.open).toBe(false);
    expect(result.current.dialogProps.title).toBe('');
    expect(result.current.dialogProps.message).toBe('');
  });

  it('should open dialog with provided title and message', async () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.confirm({ title: 'Delete Item', message: 'Are you sure?' });
    });

    expect(result.current.open).toBe(true);
    expect(result.current.dialogProps.title).toBe('Delete Item');
    expect(result.current.dialogProps.message).toBe('Are you sure?');
  });

  it('should close dialog and resolve false when handleCancel is called', async () => {
    const { result } = renderHook(() => useConfirmDialog());
    let confirmPromise: Promise<boolean>;

    act(() => {
      confirmPromise = result.current.confirm({ title: 'Delete Item', message: 'Are you sure?' });
    });

    expect(result.current.open).toBe(true);

    let resolved: boolean | undefined;
    confirmPromise.then((value) => {
      resolved = value;
    });

    act(() => {
      result.current.handleCancel();
    });

    expect(result.current.open).toBe(false);
    await act(async () => {
      await confirmPromise;
    });
    expect(resolved).toBe(false);
  });

  it('should resolve true and close dialog when handleConfirm is called', async () => {
    const { result } = renderHook(() => useConfirmDialog());
    let confirmPromise: Promise<boolean>;

    act(() => {
      confirmPromise = result.current.confirm({ title: 'Delete Item', message: 'Are you sure?' });
    });

    expect(result.current.open).toBe(true);

    let resolved: boolean | undefined;
    confirmPromise.then((value) => {
      resolved = value;
    });

    act(() => {
      result.current.handleConfirm();
    });

    expect(result.current.open).toBe(false);
    await act(async () => {
      await confirmPromise;
    });
    expect(resolved).toBe(true);
  });

  it('should handle confirm with severity option', () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.confirm({
        title: 'Delete Item',
        message: 'Are you sure?',
        severity: 'error',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      });
    });

    expect(result.current.open).toBe(true);
    expect(result.current.dialogProps.severity).toBe('error');
    expect(result.current.dialogProps.confirmText).toBe('Delete');
    expect(result.current.dialogProps.cancelText).toBe('Cancel');
  });

  it('should handle multiple open/close cycles', async () => {
    const { result } = renderHook(() => useConfirmDialog());

    // First cycle
    let promise1: Promise<boolean>;
    act(() => {
      promise1 = result.current.confirm({ title: 'First Dialog', message: 'First message' });
    });
    expect(result.current.open).toBe(true);
    expect(result.current.dialogProps.title).toBe('First Dialog');

    act(() => {
      result.current.handleCancel();
    });
    expect(result.current.open).toBe(false);

    let result1: boolean | undefined;
    await act(async () => {
      result1 = await promise1;
    });
    expect(result1).toBe(false);

    // Second cycle
    let promise2: Promise<boolean>;
    act(() => {
      promise2 = result.current.confirm({ title: 'Second Dialog', message: 'Second message' });
    });
    expect(result.current.open).toBe(true);
    expect(result.current.dialogProps.title).toBe('Second Dialog');

    act(() => {
      result.current.handleConfirm();
    });
    expect(result.current.open).toBe(false);

    let result2: boolean | undefined;
    await act(async () => {
      result2 = await promise2;
    });
    expect(result2).toBe(true);
  });
});
