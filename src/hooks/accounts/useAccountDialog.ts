import { useDialogState } from '../primitives/useDialogState';
import type { Account } from '@/types/models';

/**
 * Domain hook for account dialog management
 * Wraps useDialogState primitive with account-specific typing
 */
export function useAccountDialog() {
  return useDialogState<Account>();
}
