import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { TransactionType } from '../../types/models';

// Get all transaction types
export function useTransactionTypes(): TransactionType[] | undefined {
  return useLiveQuery(() => db.transactionTypes.toArray());
}
