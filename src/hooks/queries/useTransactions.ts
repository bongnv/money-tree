import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { Transaction } from '../../types/models';

// Get all transactions - auto-updates on changes!
export function useTransactions(): Transaction[] | undefined {
  return useLiveQuery(() => db.transactions.toArray());
}

// Get transactions by date range
export function useTransactionsByDateRange(
  startDate: string,
  endDate: string
): Transaction[] | undefined {
  return useLiveQuery(
    () => db.transactions.where('date').between(startDate, endDate, true, true).toArray(),
    [startDate, endDate]
  );
}
