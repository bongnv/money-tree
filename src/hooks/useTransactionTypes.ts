/**
 * Custom hooks for TransactionType data access
 * Uses useLiveQuery for reactive database queries
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { useTransactionTypeService } from './useServices';
import type { TransactionType } from '../types/models';

/**
 * Get all active transaction types
 */
export function useTransactionTypes(): TransactionType[] {
  const transactionTypeService = useTransactionTypeService();
  return useLiveQuery(() => transactionTypeService.getActive()) ?? [];
}

/**
 * Get transaction type by ID
 */
export function useTransactionType(id: string | undefined): TransactionType | undefined {
  const transactionTypeService = useTransactionTypeService();
  return useLiveQuery(() => {
    if (!id) return undefined;
    return transactionTypeService.getById(id);
  }, [id]);
}
