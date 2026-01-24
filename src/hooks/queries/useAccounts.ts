import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { Account } from '../../types/models';

// Get all accounts
export function useAccounts(): Account[] | undefined {
  return useLiveQuery(() => db.accounts.toArray());
}
