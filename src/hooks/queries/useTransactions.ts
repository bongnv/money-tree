import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { Transaction } from '../../types/models';

// Get all non-deleted transactions - auto-updates on changes!
export function useTransactions(): Transaction[] | undefined {
  return useLiveQuery(() =>
    db.transactions.toArray().then((items) => items.filter((t) => !t.isDeleted))
  );
}
