/**
 * Custom hooks for Transaction data access
 * Uses useLiveQuery for reactive database queries
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { useTransactionService } from '../contexts/ServiceProviders';
import type { Transaction } from '../types/models';

/**
 * Get all transactions
 */
export function useTransactions(): Transaction[] {
  const transactionService = useTransactionService();
  return useLiveQuery(() => transactionService.getActive()) ?? [];
}

/**
 * Get transaction by ID
 */
export function useTransaction(id: string | undefined): Transaction | undefined {
  const transactionService = useTransactionService();
  return useLiveQuery(() => {
    if (!id) return undefined;
    return transactionService.getById(id);
  }, [id]);
}
