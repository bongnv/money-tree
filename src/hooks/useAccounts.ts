/**
 * Custom hooks for Account data access
 * Uses useLiveQuery for reactive database queries
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { useAccountService } from '../contexts/ServiceProviders';
import type { Account } from '../types/models';

/**
 * Get all accounts
 */
export function useAccounts(): Account[] {
  const accountService = useAccountService();
  return useLiveQuery(() => accountService.getAll()) ?? [];
}

/**
 * Get active accounts
 */
export function useActiveAccounts(): Account[] {
  const accountService = useAccountService();
  return useLiveQuery(() => accountService.getActive()) ?? [];
}

/**
 * Get account by ID
 */
export function useAccount(id: string | undefined): Account | undefined {
  const accountService = useAccountService();
  return useLiveQuery(() => {
    if (!id) return undefined;
    return accountService.getById(id);
  }, [id]);
}
