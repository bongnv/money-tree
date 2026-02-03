import { renderHook, act } from '@testing-library/react';
import { useAssetDialog } from './useAssetDialog';
import type { ManualAsset } from '@/types/models';
import { AssetType, CurrencyCode } from '@/types/enums';

describe('useAssetDialog', () => {
  const mockAsset: ManualAsset = {
    id: 'asset-1',
    name: 'Test Asset',
    type: AssetType.REAL_ESTATE,
    currencyCode: CurrencyCode.USD,
    valueHistory: [
      {
        date: '2024-01-01',
        value: 100000,
      },
    ],
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useAssetDialog());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.mode).toBe('create');
    expect(result.current.selectedItem).toBe(null);
  });

  it('should open dialog in create mode', () => {
    const { result } = renderHook(() => useAssetDialog());

    act(() => {
      result.current.openCreate();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.mode).toBe('create');
    expect(result.current.selectedItem).toBe(null);
  });

  it('should open dialog in edit mode with asset', () => {
    const { result } = renderHook(() => useAssetDialog());

    act(() => {
      result.current.openEdit(mockAsset);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.mode).toBe('edit');
    expect(result.current.selectedItem).toBe(mockAsset);
  });

  it('should open dialog in view mode with asset', () => {
    const { result } = renderHook(() => useAssetDialog());

    act(() => {
      result.current.openView(mockAsset);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.mode).toBe('view');
    expect(result.current.selectedItem).toBe(mockAsset);
  });

  it('should close dialog immediately', () => {
    const { result } = renderHook(() => useAssetDialog());

    act(() => {
      result.current.openEdit(mockAsset);
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should clear selected item and reset mode after delay when closing', async () => {
    const { result } = renderHook(() => useAssetDialog());

    act(() => {
      result.current.openEdit(mockAsset);
    });

    expect(result.current.mode).toBe('edit');
    expect(result.current.selectedItem).toBe(mockAsset);

    act(() => {
      result.current.close();
    });

    // Should still have item and mode immediately after close
    expect(result.current.selectedItem).toBe(mockAsset);
    expect(result.current.mode).toBe('edit');

    // Wait for timeout
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    // Should clear item and reset mode after timeout
    expect(result.current.selectedItem).toBe(null);
    expect(result.current.mode).toBe('create');
  });

  it('should handle multiple open/close cycles', () => {
    const { result } = renderHook(() => useAssetDialog());

    // First cycle - create
    act(() => {
      result.current.openCreate();
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.mode).toBe('create');

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);

    // Second cycle - edit
    act(() => {
      result.current.openEdit(mockAsset);
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.mode).toBe('edit');

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);

    // Third cycle - view
    act(() => {
      result.current.openView(mockAsset);
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.mode).toBe('view');
  });

  it('should maintain stable callback references', () => {
    const { result, rerender } = renderHook(() => useAssetDialog());

    const initialOpenCreate = result.current.openCreate;
    const initialOpenEdit = result.current.openEdit;
    const initialOpenView = result.current.openView;
    const initialClose = result.current.close;

    rerender();

    expect(result.current.openCreate).toBe(initialOpenCreate);
    expect(result.current.openEdit).toBe(initialOpenEdit);
    expect(result.current.openView).toBe(initialOpenView);
    expect(result.current.close).toBe(initialClose);
  });
});
