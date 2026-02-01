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
 * Returns undefined while loading from database
 */
export function useBaseCurrency(): CurrencyCode | undefined {
  const syncMetadataService = useSyncMetadataService();
  return useLiveQuery(() => syncMetadataService.getBaseCurrency());
}

/**
 * Get archived years
 */
export function useArchivedYears(): ArchivedYearReference[] | undefined {
  const syncMetadataService = useSyncMetadataService();
  return useLiveQuery(() => syncMetadataService.getArchivedYears());
}

/**
 * Get last modified timestamp
 */
export function useLastModified(): string | null | undefined {
  const syncMetadataService = useSyncMetadataService();
  return useLiveQuery(() => syncMetadataService.getLastModified());
}
