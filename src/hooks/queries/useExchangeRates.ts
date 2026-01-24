import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { ExchangeRate } from '../../types/models';

// Get all exchange rates
export function useExchangeRates(): ExchangeRate[] | undefined {
  return useLiveQuery(() => db.exchangeRates.toArray());
}
