import { renderHook, act } from '@testing-library/react';
import { useDialogState } from './useDialogState';
import { waitFor } from '@testing-library/react';

describe('useDialogState', () => {
  interface TestItem {
    id: string;
    name: string;
  }

  const mockItem: TestItem = {
    id: '1',
    name: 'Test Item',
  };

  describe('initialization', () => {
    it('should initialize with closed state and create mode', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.mode).toBe('create');
      expect(result.current.selectedItem).toBeNull();
      expect(result.current.isCreateMode).toBe(true);
      expect(result.current.isEditMode).toBe(false);
      expect(result.current.isViewMode).toBe(false);
    });
  });

  describe('openCreate', () => {
    it('should open dialog in create mode', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      act(() => {
        result.current.openCreate();
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe('create');
      expect(result.current.selectedItem).toBeNull();
      expect(result.current.isCreateMode).toBe(true);
    });

    it('should clear selected item when opening in create mode', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      // First open in edit mode with item
      act(() => {
        result.current.openEdit(mockItem);
      });

      expect(result.current.selectedItem).toEqual(mockItem);

      // Then open in create mode
      act(() => {
        result.current.openCreate();
      });

      expect(result.current.selectedItem).toBeNull();
      expect(result.current.mode).toBe('create');
    });
  });

  describe('openEdit', () => {
    it('should open dialog in edit mode with selected item', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      act(() => {
        result.current.openEdit(mockItem);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe('edit');
      expect(result.current.selectedItem).toEqual(mockItem);
      expect(result.current.isEditMode).toBe(true);
    });

    it('should replace previous selected item', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      const firstItem: TestItem = { id: '1', name: 'First' };
      const secondItem: TestItem = { id: '2', name: 'Second' };

      act(() => {
        result.current.openEdit(firstItem);
      });

      expect(result.current.selectedItem).toEqual(firstItem);

      act(() => {
        result.current.openEdit(secondItem);
      });

      expect(result.current.selectedItem).toEqual(secondItem);
    });
  });

  describe('openView', () => {
    it('should open dialog in view mode with selected item', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      act(() => {
        result.current.openView(mockItem);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe('view');
      expect(result.current.selectedItem).toEqual(mockItem);
      expect(result.current.isViewMode).toBe(true);
    });
  });

  describe('close', () => {
    it('should close dialog immediately', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      act(() => {
        result.current.openEdit(mockItem);
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should reset mode and selected item after delay', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useDialogState<TestItem>());

      act(() => {
        result.current.openEdit(mockItem);
      });

      expect(result.current.selectedItem).toEqual(mockItem);

      act(() => {
        result.current.close();
      });

      // Immediately after close - still has selected item
      expect(result.current.selectedItem).toEqual(mockItem);
      expect(result.current.mode).toBe('edit');

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // After 300ms - should be reset
      await waitFor(() => {
        expect(result.current.selectedItem).toBeNull();
        expect(result.current.mode).toBe('create');
      });

      jest.useRealTimers();
    });
  });

  describe('switchToEdit', () => {
    it('should switch from view mode to edit mode', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      act(() => {
        result.current.openView(mockItem);
      });

      expect(result.current.mode).toBe('view');
      expect(result.current.isViewMode).toBe(true);

      act(() => {
        result.current.switchToEdit();
      });

      expect(result.current.mode).toBe('edit');
      expect(result.current.isEditMode).toBe(true);
      expect(result.current.selectedItem).toEqual(mockItem);
    });

    it('should keep dialog open when switching mode', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      act(() => {
        result.current.openView(mockItem);
        result.current.switchToEdit();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should work from any mode', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      act(() => {
        result.current.openCreate();
        result.current.switchToEdit();
      });

      expect(result.current.mode).toBe('edit');
    });
  });

  describe('updateSelectedItem', () => {
    it('should update the selected item', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      const updatedItem: TestItem = { id: '1', name: 'Updated Item' };

      act(() => {
        result.current.openEdit(mockItem);
        result.current.updateSelectedItem(updatedItem);
      });

      expect(result.current.selectedItem).toEqual(updatedItem);
    });

    it('should allow clearing selected item', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      act(() => {
        result.current.openEdit(mockItem);
        result.current.updateSelectedItem(null);
      });

      expect(result.current.selectedItem).toBeNull();
    });

    it('should not affect other state', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      const updatedItem: TestItem = { id: '1', name: 'Updated' };

      act(() => {
        result.current.openEdit(mockItem);
        result.current.updateSelectedItem(updatedItem);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe('edit');
    });
  });

  describe('computed helpers', () => {
    it('should correctly compute isCreateMode', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      act(() => {
        result.current.openCreate();
      });

      expect(result.current.isCreateMode).toBe(true);
      expect(result.current.isEditMode).toBe(false);
      expect(result.current.isViewMode).toBe(false);
    });

    it('should correctly compute isEditMode', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      act(() => {
        result.current.openEdit(mockItem);
      });

      expect(result.current.isCreateMode).toBe(false);
      expect(result.current.isEditMode).toBe(true);
      expect(result.current.isViewMode).toBe(false);
    });

    it('should correctly compute isViewMode', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      act(() => {
        result.current.openView(mockItem);
      });

      expect(result.current.isCreateMode).toBe(false);
      expect(result.current.isEditMode).toBe(false);
      expect(result.current.isViewMode).toBe(true);
    });
  });

  describe('complex workflows', () => {
    it('should handle full edit workflow', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      // Open for editing
      act(() => {
        result.current.openEdit(mockItem);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.isEditMode).toBe(true);
      expect(result.current.selectedItem).toEqual(mockItem);

      // Make optimistic update
      const updated: TestItem = { ...mockItem, name: 'Updated' };
      act(() => {
        result.current.updateSelectedItem(updated);
      });

      expect(result.current.selectedItem).toEqual(updated);

      // Close after save
      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should handle view -> edit -> save workflow', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      // Open in view mode
      act(() => {
        result.current.openView(mockItem);
      });

      expect(result.current.isViewMode).toBe(true);

      // Switch to edit
      act(() => {
        result.current.switchToEdit();
      });

      expect(result.current.isEditMode).toBe(true);
      expect(result.current.selectedItem).toEqual(mockItem);

      // Close after saving
      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should handle create -> edit transition', () => {
      const { result } = renderHook(() => useDialogState<TestItem>());

      // Open create dialog
      act(() => {
        result.current.openCreate();
      });

      expect(result.current.isCreateMode).toBe(true);
      expect(result.current.selectedItem).toBeNull();

      // Close and open edit
      act(() => {
        result.current.close();
      });

      act(() => {
        result.current.openEdit(mockItem);
      });

      expect(result.current.isEditMode).toBe(true);
      expect(result.current.selectedItem).toEqual(mockItem);
    });
  });

  describe('without type parameter', () => {
    it('should work with any type when no generic provided', () => {
      const { result } = renderHook(() => useDialogState());

      const anyItem = { foo: 'bar', baz: 123 };

      act(() => {
        result.current.openEdit(anyItem);
      });

      expect(result.current.selectedItem).toEqual(anyItem);
    });
  });
});
