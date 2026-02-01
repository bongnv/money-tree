import { useState, useCallback } from 'react';
import type { ManualAsset } from '@/types/models';

type DialogMode = 'create' | 'edit' | 'view';

/**
 * Domain hook for asset dialog management
 * Manages dialog state with asset-specific modes (create/edit/update-value)
 */
export function useAssetDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>('create');
  const [selectedItem, setSelectedItem] = useState<ManualAsset | null>(null);

  const openCreate = useCallback(() => {
    setMode('create');
    setSelectedItem(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((asset: ManualAsset) => {
    setMode('edit');
    setSelectedItem(asset);
    setIsOpen(true);
  }, []);

  const openView = useCallback((item: ManualAsset) => {
    setMode('view');
    setSelectedItem(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setMode('create');
      setSelectedItem(null);
    }, 300);
  }, []);

  return {
    isOpen,
    mode,
    selectedItem,
    openCreate,
    openEdit,
    openView,
    close,
  };
}
