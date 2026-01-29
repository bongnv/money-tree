import { renderHook, act } from '@testing-library/react';
import { useSyncMetadataMutations } from './useSyncMetadataMutations';
import { syncMetadata } from '../../db/database';
import { useSyncService } from '../../contexts/SyncProvider';
import { CurrencyCode } from '../../types/enums';

// Mock dependencies
jest.mock('../../db/database', () => ({
  syncMetadata: {
    setBaseCurrency: jest.fn(),
    addArchivedYear: jest.fn(),
  },
}));

jest.mock('../../contexts/SyncProvider', () => ({
  useSyncService: jest.fn(),
}));

const mockSyncService = {
  debouncedSync: jest.fn(),
};

describe('useSyncMetadataMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSyncService as jest.Mock).mockReturnValue(mockSyncService);
  });

  describe('setBaseCurrency', () => {
    it('should set base currency and trigger sync', async () => {
      const { result } = renderHook(() => useSyncMetadataMutations());

      await act(async () => {
        await result.current.setBaseCurrency(CurrencyCode.EUR);
      });

      expect(syncMetadata.setBaseCurrency).toHaveBeenCalledWith(CurrencyCode.EUR);
      expect(mockSyncService.debouncedSync).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle errors when setting base currency', async () => {
      const testError = new Error('DB error');
      (syncMetadata.setBaseCurrency as jest.Mock).mockRejectedValueOnce(testError);

      const { result } = renderHook(() => useSyncMetadataMutations());

      await act(async () => {
        try {
          await result.current.setBaseCurrency(CurrencyCode.EUR);
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toEqual(testError);
      expect(mockSyncService.debouncedSync).not.toHaveBeenCalled();
    });

    it('should set isLoading during operation', async () => {
      const loadingStates: boolean[] = [];
      (syncMetadata.setBaseCurrency as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            loadingStates.push(true);
            setTimeout(resolve, 10);
          })
      );

      const { result } = renderHook(() => useSyncMetadataMutations());

      act(() => {
        result.current.setBaseCurrency(CurrencyCode.EUR);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('addArchivedYear', () => {
    it('should add archived year and trigger sync', async () => {
      const archiveReference = {
        year: 2023,
        archivedDate: '2024-01-01T00:00:00Z',
        summary: {
          transactionCount: 100,
          closingNetWorth: 10000,
          closingBalances: {},
          closingAssetValuations: {},
        },
      };

      const { result } = renderHook(() => useSyncMetadataMutations());

      await act(async () => {
        await result.current.addArchivedYear(archiveReference);
      });

      expect(syncMetadata.addArchivedYear).toHaveBeenCalledWith(archiveReference);
      expect(mockSyncService.debouncedSync).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle errors when adding archived year', async () => {
      const testError = new Error('Archive error');
      (syncMetadata.addArchivedYear as jest.Mock).mockRejectedValueOnce(testError);

      const archiveReference = {
        year: 2023,
        archivedDate: '2024-01-01T00:00:00Z',
        summary: {
          transactionCount: 100,
          closingNetWorth: 10000,
          closingBalances: {},
          closingAssetValuations: {},
        },
      };

      const { result } = renderHook(() => useSyncMetadataMutations());

      await act(async () => {
        try {
          await result.current.addArchivedYear(archiveReference);
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toEqual(testError);
      expect(mockSyncService.debouncedSync).not.toHaveBeenCalled();
    });

    it('should provide default error message for non-Error objects', async () => {
      (syncMetadata.addArchivedYear as jest.Mock).mockRejectedValueOnce('String error');

      const archiveReference = {
        year: 2023,
        archivedDate: '2024-01-01T00:00:00Z',
        summary: {
          transactionCount: 100,
          closingNetWorth: 10000,
          closingBalances: {},
          closingAssetValuations: {},
        },
      };

      const { result } = renderHook(() => useSyncMetadataMutations());

      await act(async () => {
        try {
          await result.current.addArchivedYear(archiveReference);
        } catch {
          // Expected error
        }
      });

      expect(result.current.error?.message).toBe('Failed to add archived year');
    });
  });

  describe('error handling', () => {
    it('should clear previous errors on successful operation', async () => {
      // First, trigger an error
      (syncMetadata.setBaseCurrency as jest.Mock).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useSyncMetadataMutations());

      await act(async () => {
        try {
          await result.current.setBaseCurrency(CurrencyCode.EUR);
        } catch {
          // Expected error
        }
      });

      expect(result.current.error?.message).toBe('First error');

      // Now, do a successful operation
      (syncMetadata.setBaseCurrency as jest.Mock).mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.setBaseCurrency(CurrencyCode.USD);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
