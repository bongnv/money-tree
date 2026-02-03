import { useState, useEffect, useCallback } from 'react';
import { useArchiveService } from './useServices';
import { useStore } from '@/contexts/StoreContext';
import { useAppContext } from '@/contexts/AppContext';
import { useSync } from '@/contexts/SyncContext';
import type { YearEndSummary } from '@/types/models';
import type { CurrencyCode } from '@/types/enums';
import type { CloudItem } from '@/services/storage/IStorageProvider';

interface ConfirmDialogState {
  open: boolean;
  year: number | null;
}

interface UseArchiveManagerReturn {
  // Data
  archivableYear: number | null;
  yearSummaries: Record<number, YearEndSummary>;
  archivedYears: ReturnType<typeof useStore>['archivedYears'];
  baseCurrency: CurrencyCode;

  // Loading states
  isExporting: boolean;
  exportingYear: number | null;

  // Dialog state
  confirmDialog: ConfirmDialogState;

  // Actions
  handleExportYear: (year: number) => Promise<void>;
  handleOpenConfirmDialog: (year: number) => void;
  handleCloseConfirmDialog: () => void;
}

/**
 * Hook for managing archive operations
 * Handles fetching archivable years, summaries, and coordinating the export flow
 */
export function useArchiveManager(): UseArchiveManagerReturn {
  const { baseCurrency, archivedYears } = useStore();
  const archiveService = useArchiveService();
  const { showSnackbar } = useAppContext();
  const { provider, currentFile } = useSync();

  // State
  const [isExporting, setIsExporting] = useState(false);
  const [exportingYear, setExportingYear] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    year: null,
  });
  const [yearSummaries, setYearSummaries] = useState<Record<number, YearEndSummary>>({});
  const [archivableYear, setArchivableYear] = useState<number | null>(null);

  // Fetch archivable year
  useEffect(() => {
    let isMounted = true;

    const getArchivableYear = async () => {
      const year = await archiveService.identifyArchivableYear();
      if (isMounted) {
        setArchivableYear(year);
      }
    };

    getArchivableYear();

    return () => {
      isMounted = false;
    };
  }, [archiveService]);

  // Calculate summary for archivable year
  useEffect(() => {
    let isMounted = true;

    const calculateSummary = async () => {
      if (archivableYear !== null) {
        const summary = await archiveService.calculateYearEndSummary(archivableYear);
        if (isMounted) {
          setYearSummaries({ [archivableYear]: summary });
        }
      } else {
        setYearSummaries({});
      }
    };

    calculateSummary();

    return () => {
      isMounted = false;
    };
  }, [archivableYear, archiveService]);

  // Dialog actions
  const handleOpenConfirmDialog = useCallback((year: number) => {
    setConfirmDialog({ open: true, year });
  }, []);

  const handleCloseConfirmDialog = useCallback(() => {
    setConfirmDialog({ open: false, year: null });
  }, []);

  // Export year - calls service to handle complete archive operation
  const handleExportYear = useCallback(
    async (year: number) => {
      // Close confirmation dialog
      setConfirmDialog({ open: false, year: null });

      setIsExporting(true);
      setExportingYear(year);

      try {
        // Verify we have a storage provider
        if (!provider) {
          throw new Error('No cloud storage connected. Please connect to a cloud provider first.');
        }

        // For now, use root folder for archives
        // TODO: Allow user to configure archive folder location
        const archiveFolder: CloudItem = {
          id: currentFile?.parentItemId ?? 'root',
          name: '',
          isFolder: true,
        };

        // Archive year (creates file, uploads to cloud, removes local data)
        await archiveService.archiveYear(year, provider, archiveFolder);

        showSnackbar(
          `Year ${year} archived successfully. Data has been removed from the main file.`,
          'success'
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to export archive';
        showSnackbar(message, 'error');
      } finally {
        setIsExporting(false);
        setExportingYear(null);
      }
    },
    [archiveService, provider, showSnackbar]
  );

  return {
    archivableYear,
    yearSummaries,
    archivedYears,
    baseCurrency,
    isExporting,
    exportingYear,
    confirmDialog,
    handleExportYear,
    handleOpenConfirmDialog,
    handleCloseConfirmDialog,
  };
}
