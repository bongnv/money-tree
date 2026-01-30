/**
 * Custom hooks for SyncMetadata data access
 * Uses useLiveQuery for reactive database queries
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { useSyncMetadataService } from './useServices';
import { CurrencyCode } from '../types/enums';
import type { ArchivedYearReference } from '../types/models';

/**
 * Get base currency
 */
export function useBaseCurrency(): CurrencyCode {
  const syncMetadataService = useSyncMetadataService();
  return useLiveQuery(() => syncMetadataService.getBaseCurrency()) || CurrencyCode.USD;
}

/**
 * Get archived years
 */
export function useArchivedYears(): ArchivedYearReference[] {
  const syncMetadataService = useSyncMetadataService();
  return useLiveQuery(() => syncMetadataService.getArchivedYears()) ?? [];
}

/**
 * Get last modified timestamp
 */
export function useLastModified(): string | null {
  const syncMetadataService = useSyncMetadataService();
  return useLiveQuery(() => syncMetadataService.getLastModified()) ?? null;
}
