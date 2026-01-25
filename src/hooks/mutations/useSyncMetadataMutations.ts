import { useState, useCallback } from 'react';
import { syncMetadata } from '../../db/database';
import type { ArchivedYearReference } from '../../types/models';
import { CurrencyCode } from '../../types/enums';
import { useSyncService } from '../../contexts/SyncProvider';

/**
 * Hook for user-initiated syncMetadata mutations
 * Only includes mutations that should trigger a sync
 * Service-level metadata updates (like setLastSynced during sync) should call syncMetadata directly
 */
export function useSyncMetadataMutations() {
  const syncService = useSyncService();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setBaseCurrency = useCallback(
    async (currency: CurrencyCode) => {
      setIsLoading(true);
      setError(null);
      try {
        await syncMetadata.setBaseCurrency(currency);
        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to set base currency');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  const addArchivedYear = useCallback(
    async (year: ArchivedYearReference) => {
      setIsLoading(true);
      setError(null);
      try {
        await syncMetadata.addArchivedYear(year);
        syncService.debouncedSync();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add archived year');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncService]
  );

  return {
    setBaseCurrency,
    addArchivedYear,
    isLoading,
    error,
  };
}
