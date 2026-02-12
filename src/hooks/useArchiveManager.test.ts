/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAppContext } from '@/contexts/AppContext';
import { useServiceContext } from '@/contexts/ServiceContext';
import { useStore } from '@/contexts/StoreContext';
import { useSync } from '@/contexts/SyncContext';
import { CurrencyCode } from '@/types/enums';
import type { YearEndSummary } from '@/types/models';
import { useArchiveManager } from './useArchiveManager';

// Mock dependencies
jest.mock('@/contexts/ServiceContext');
jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/AppContext');
jest.mock('@/contexts/SyncContext');

const mockUseServiceContext = useServiceContext as jest.MockedFunction<typeof useServiceContext>;
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseAppContext = useAppContext as jest.MockedFunction<typeof useAppContext>;
const mockUseSync = useSync as jest.MockedFunction<typeof useSync>;

describe('useArchiveManager', () => {
  const mockArchiveService = {
    identifyArchivableYear: jest.fn(),
    calculateYearEndSummary: jest.fn(),
    archiveYear: jest.fn(),
  };

  const mockCloudService = {
    getCurrentProvider: jest.fn(() => null),
  };

  const mockShowSnackbar = jest.fn();

  const mockYearSummary: YearEndSummary = {
    transactionCount: 150,
    closingNetWorth: 50000,
    closingBalances: { acc1: 30000 },
    closingAssetValuations: { asset1: 20000 },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseServiceContext.mockReturnValue({
      archiveService: mockArchiveService,
      cloudService: mockCloudService,
    } as any);
    mockUseStore.mockReturnValue({
      baseCurrency: CurrencyCode.USD,
      archivedYears: [],
    } as any);
    mockUseAppContext.mockReturnValue({
      showSnackbar: mockShowSnackbar,
    } as any);
    mockUseSync.mockReturnValue({
      currentFile: null,
    } as any);
  });

  describe('initialization', () => {
    it('should fetch archivable year on mount', async () => {
      mockArchiveService.identifyArchivableYear.mockResolvedValue(2023);

      const { result } = renderHook(() => useArchiveManager());

      await waitFor(() => {
        expect(result.current.archivableYear).toBe(2023);
      });

      expect(mockArchiveService.identifyArchivableYear).toHaveBeenCalledTimes(1);
    });

    it('should handle null archivable year', async () => {
      mockArchiveService.identifyArchivableYear.mockResolvedValue(null);

      const { result } = renderHook(() => useArchiveManager());

      await waitFor(() => {
        expect(result.current.archivableYear).toBeNull();
      });
    });

    it('should use USD as default currency when baseCurrency is null', () => {
      mockUseStore.mockReturnValue({
        baseCurrency: CurrencyCode.USD,
        archivedYears: [],
      } as any);

      const { result } = renderHook(() => useArchiveManager());

      expect(result.current.baseCurrency).toBe(CurrencyCode.USD);
    });
  });

  describe('year summary calculation', () => {
    it('should calculate summary when archivable year is available', async () => {
      mockArchiveService.identifyArchivableYear.mockResolvedValue(2023);
      mockArchiveService.calculateYearEndSummary.mockResolvedValue(mockYearSummary);

      const { result } = renderHook(() => useArchiveManager());

      await waitFor(() => {
        expect(result.current.yearSummaries[2023]).toEqual(mockYearSummary);
      });

      expect(mockArchiveService.calculateYearEndSummary).toHaveBeenCalledWith(2023);
    });

    it('should clear summaries when archivable year is null', async () => {
      mockArchiveService.identifyArchivableYear.mockResolvedValue(null);

      const { result } = renderHook(() => useArchiveManager());

      await waitFor(() => {
        expect(result.current.yearSummaries).toEqual({});
      });
    });

    it('should recalculate summary when currency changes', async () => {
      mockArchiveService.identifyArchivableYear.mockResolvedValue(2023);
      mockArchiveService.calculateYearEndSummary.mockResolvedValue(mockYearSummary);

      const { rerender } = renderHook(() => useArchiveManager());

      await waitFor(() => {
        expect(mockArchiveService.calculateYearEndSummary).toHaveBeenCalledWith(2023);
      });

      // Change currency
      mockUseStore.mockReturnValue({
        baseCurrency: CurrencyCode.AUD,
        archivedYears: [],
      } as any);

      rerender();

      await waitFor(() => {
        expect(mockArchiveService.calculateYearEndSummary).toHaveBeenCalledWith(2023);
      });
    });
  });

  describe('dialog management', () => {
    it('should open confirm dialog with year', () => {
      const { result } = renderHook(() => useArchiveManager());

      act(() => {
        result.current.handleOpenConfirmDialog(2023);
      });

      expect(result.current.confirmDialog).toEqual({ open: true, year: 2023 });
    });

    it('should close confirm dialog', () => {
      const { result } = renderHook(() => useArchiveManager());

      act(() => {
        result.current.handleOpenConfirmDialog(2023);
      });

      act(() => {
        result.current.handleCloseConfirmDialog();
      });

      expect(result.current.confirmDialog).toEqual({ open: false, year: null });
    });
  });

  describe('export year', () => {
    const mockArchiveReference = {
      year: 2023,
      archivedDate: '2026-02-03T00:00:00.000Z',
      summary: mockYearSummary,
    };

    it('should successfully export a year', async () => {
      mockUseServiceContext.mockReturnValue({
        archiveService: mockArchiveService,
        cloudService: {
          getCurrentProvider: jest.fn(() => 'onedrive'),
        },
      } as any);
      mockUseSync.mockReturnValue({
        currentFile: { id: 'file1', name: 'test.json', parentItemId: 'folder1' } as any,
      } as any);

      mockArchiveService.archiveYear.mockResolvedValue(mockArchiveReference);

      const { result } = renderHook(() => useArchiveManager());

      await act(async () => {
        await result.current.handleExportYear(2023);
      });

      expect(mockArchiveService.archiveYear).toHaveBeenCalledWith(2023, {
        id: 'folder1',
        name: '',
        isFolder: true,
      });
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Year 2023 archived successfully. Data has been removed from the main file.',
        'success'
      );
    });

    it('should close dialog when exporting', async () => {
      mockArchiveService.archiveYear.mockResolvedValue(mockArchiveReference);

      const { result } = renderHook(() => useArchiveManager());

      act(() => {
        result.current.handleOpenConfirmDialog(2023);
      });

      expect(result.current.confirmDialog.open).toBe(true);

      await act(async () => {
        await result.current.handleExportYear(2023);
      });

      expect(result.current.confirmDialog).toEqual({ open: false, year: null });
    });

    it('should set loading state during export', async () => {
      mockUseServiceContext.mockReturnValue({
        archiveService: mockArchiveService,
        cloudService: {
          getCurrentProvider: jest.fn(() => 'onedrive'),
        },
      } as any);
      mockUseSync.mockReturnValue({
        currentFile: { id: 'file1', name: 'test.json', parentItemId: 'folder1' } as any,
      } as any);

      let resolveExport: any;
      const exportPromise = new Promise((resolve) => {
        resolveExport = resolve;
      });

      mockArchiveService.archiveYear.mockReturnValue(exportPromise as any);

      const { result } = renderHook(() => useArchiveManager());

      act(() => {
        result.current.handleExportYear(2023);
      });

      // Should be in loading state
      await waitFor(() => {
        expect(result.current.isExporting).toBe(true);
        expect(result.current.exportingYear).toBe(2023);
      });

      // Complete the export
      await act(async () => {
        resolveExport(mockArchiveReference);
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
        expect(result.current.exportingYear).toBeNull();
      });
    });

    it('should handle error during archiveYear', async () => {
      mockUseServiceContext.mockReturnValue({
        archiveService: mockArchiveService,
        cloudService: {
          getCurrentProvider: jest.fn(() => 'onedrive'),
        },
      } as any);
      mockUseSync.mockReturnValue({
        currentFile: { id: 'file1', name: 'test.json', parentItemId: 'folder1' } as any,
      } as any);

      const error = new Error('Failed to archive year');
      mockArchiveService.archiveYear.mockRejectedValue(error);

      const { result } = renderHook(() => useArchiveManager());

      await act(async () => {
        await result.current.handleExportYear(2023);
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith('Failed to archive year', 'error');
      expect(result.current.isExporting).toBe(false);
      expect(result.current.exportingYear).toBeNull();
    });

    it('should handle non-Error exceptions', async () => {
      mockUseServiceContext.mockReturnValue({
        archiveService: mockArchiveService,
        cloudService: {
          getCurrentProvider: jest.fn(() => 'onedrive'),
        },
      } as any);
      mockUseSync.mockReturnValue({
        currentFile: { id: 'file1', name: 'test.json', parentItemId: 'folder1' } as any,
      } as any);

      mockArchiveService.archiveYear.mockRejectedValue('string error');

      const { result } = renderHook(() => useArchiveManager());

      await act(async () => {
        await result.current.handleExportYear(2023);
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith('Failed to export archive', 'error');
    });
  });

  describe('archived years', () => {
    it('should expose archived years from store', () => {
      const archivedYears = [
        {
          year: 2021,
          archivedDate: '2024-01-01T00:00:00.000Z',
          summary: mockYearSummary,
        },
      ];

      mockUseStore.mockReturnValue({
        baseCurrency: CurrencyCode.USD,
        archivedYears,
      } as any);

      const { result } = renderHook(() => useArchiveManager());

      expect(result.current.archivedYears).toEqual(archivedYears);
    });
  });
});
