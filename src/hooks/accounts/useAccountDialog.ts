import { useState, useCallback } from 'react';
import type { Account } from '@/types/models';

/**
 * Domain hook for account dialog management
 * Manages dialog state with account-specific typing
 */
export function useAccountDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Account | null>(null);

  const openCreate = useCallback(() => {
    setSelectedItem(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((item: Account) => {
    setSelectedItem(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setSelectedItem(null);
    }, 300);
  }, []);

  return {
    isOpen,
    selectedItem,
    openCreate,
    openEdit,
    close,
  };
}
