import { useState, useCallback } from 'react';
import type { Transaction } from '@/types/models';

/**
 * Domain hook for transaction dialog management
 * Manages dialog state with transaction-specific typing
 */
export function useTransactionDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Transaction | null>(null);

  const openCreate = useCallback(() => {
    setSelectedItem(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((item: Transaction) => {
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
