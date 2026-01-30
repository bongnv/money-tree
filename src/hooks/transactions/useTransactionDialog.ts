import { useDialogState } from '../primitives/useDialogState';
import type { Transaction } from '@/types/models';

/**
 * Domain hook for transaction dialog management
 * Wraps useDialogState primitive with transaction-specific typing
 */
export function useTransactionDialog() {
  return useDialogState<Transaction>();
}
