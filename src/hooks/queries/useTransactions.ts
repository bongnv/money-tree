import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { Transaction } from '../../types/models';

// Get all transactions - auto-updates on changes!
export function useTransactions(): Transaction[] | undefined {
  return useLiveQuery(() => db.transactions.toArray());
}
