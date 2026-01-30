import { useState, useCallback } from 'react';

/**
 * Dialog modes for create/edit/view operations
 */
export type DialogMode = 'create' | 'edit' | 'view';

/**
 * Generic dialog state management hook
 * Handles open/close, mode (create/edit/view), and selected item
 * 
 * @template T - The type of item being displayed/edited in the dialog
 * @returns Dialog state and handlers
 */
export function useDialogState<T = any>() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>('create');
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  /**
   * Open dialog in create mode
   */
  const openCreate = useCallback(() => {
    setMode('create');
    setSelectedItem(null);
    setIsOpen(true);
  }, []);

  /**
   * Open dialog in edit mode with selected item
   */
  const openEdit = useCallback((item: T) => {
    setMode('edit');
    setSelectedItem(item);
    setIsOpen(true);
  }, []);

  /**
   * Open dialog in view mode with selected item
   */
  const openView = useCallback((item: T) => {
    setMode('view');
    setSelectedItem(item);
    setIsOpen(true);
  }, []);

  /**
   * Close dialog and reset state
   */
  const close = useCallback(() => {
    setIsOpen(false);
    // Delay reset to allow animation to complete
    setTimeout(() => {
      setMode('create');
      setSelectedItem(null);
    }, 300);
  }, []);

  /**
   * Switch to edit mode (useful when viewing and user clicks "Edit")
   */
  const switchToEdit = useCallback(() => {
    setMode('edit');
  }, []);

  /**
   * Update the selected item (useful for optimistic updates)
   */
  const updateSelectedItem = useCallback((item: T | null) => {
    setSelectedItem(item);
  }, []);

  return {
    // State
    isOpen,
    mode,
    selectedItem,
    
    // Computed helpers
    isCreateMode: mode === 'create',
    isEditMode: mode === 'edit',
    isViewMode: mode === 'view',
    
    // Actions
    openCreate,
    openEdit,
    openView,
    close,
    switchToEdit,
    updateSelectedItem,
  };
}
