import { useLiveQuery } from 'dexie-react-hooks';
import { syncMetadata } from '../../db/database';
import { CurrencyCode } from '../../types/enums';
import type { ArchivedYearReference } from '../../types/models';

/**
 * Hook to get base currency from Dexie
 */
export function useBaseCurrency(): CurrencyCode {
  const value = useLiveQuery(() => syncMetadata.getBaseCurrency());
  return (value as CurrencyCode) || CurrencyCode.USD;
}

/**
 * Hook to get archived years from Dexie
 */
export function useArchivedYears(): ArchivedYearReference[] {
  return useLiveQuery(() => syncMetadata.getArchivedYears()) ?? [];
}
