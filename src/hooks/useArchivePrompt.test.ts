import { renderHook, waitFor } from '@testing-library/react';
import { useArchivePrompt } from './useArchivePrompt';
import { useArchiveService } from './useServices';
import { useSync } from '@/contexts/SyncContext';
import { useStore } from '@/contexts/StoreContext';
import { CurrencyCode } from '@/types/enums';
import { act } from 'react';

// Mock dependencies
jest.mock('./useServices');
jest.mock('@/contexts/SyncContext');
jest.mock('@/contexts/StoreContext');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseArchiveService = useArchiveService as jest.MockedFunction<typeof useArchiveService>;
const mockUseSync = useSync as jest.MockedFunction<typeof useSync>;

describe('useArchivePrompt', () => {
  const mockArchiveService = {
    identifyArchivableYear: jest.fn(),
    calculateYearEndSummary: jest.fn(),
    createArchive: jest.fn(),
    getArchives: jest.fn(),
    deleteArchive: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({
      baseCurrency: CurrencyCode.USD,
    } as any);
    mockUseArchiveService.mockReturnValue(mockArchiveService as any);
    mockUseSync.mockReturnValue({
      syncStatus: {
        status: 'synced',
        errorMessage: null,
        providerName: 'OneDrive',
        fileName: 'test.json',
      },
      selectFile: jest.fn(),
      listItems: jest.fn(),
      fullSync: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
  });

  it('should not show prompt when not connected', async () => {
    mockUseSync.mockReturnValue({
      syncStatus: {
        status: 'not-connected',
        errorMessage: null,
        providerName: null,
        fileName: null,
      },
      selectFile: jest.fn(),
      listItems: jest.fn(),
      fullSync: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    });

    const { result } = renderHook(() => useArchivePrompt());

    expect(result.current.showPrompt).toBe(false);
    expect(result.current.archiveYear).toBe(null);
    expect(result.current.archiveYearSummary).toBe(null);
  });

  it('should show prompt when archivable year is found', async () => {
    const mockSummary = {
      transactionCount: 100,
      closingNetWorth: 50000,
      closingBalances: { 'account-1': 1000 },
      closingAssetValuations: { 'asset-1': 5000 },
    };

    mockArchiveService.identifyArchivableYear.mockResolvedValue(2023);
    mockArchiveService.calculateYearEndSummary.mockResolvedValue(mockSummary);

    const { result } = renderHook(() => useArchivePrompt());

    await waitFor(() => {
      expect(result.current.showPrompt).toBe(true);
      expect(result.current.archiveYear).toBe(2023);
      expect(result.current.archiveYearSummary).toEqual(mockSummary);
    });

    expect(mockArchiveService.identifyArchivableYear).toHaveBeenCalled();
    expect(mockArchiveService.calculateYearEndSummary).toHaveBeenCalledWith(2023, CurrencyCode.USD);
  });

  it('should not show prompt when no archivable year found', async () => {
    mockArchiveService.identifyArchivableYear.mockResolvedValue(null);

    const { result } = renderHook(() => useArchivePrompt());

    await waitFor(() => {
      expect(mockArchiveService.identifyArchivableYear).toHaveBeenCalled();
    });

    expect(result.current.showPrompt).toBe(false);
    expect(result.current.archiveYear).toBe(null);
  });

  it('should hide prompt when handleRemindLater is called', async () => {
    const mockSummary = {
      transactionCount: 100,
      closingNetWorth: 50000,
      closingBalances: {},
      closingAssetValuations: {},
    };

    mockArchiveService.identifyArchivableYear.mockResolvedValue(2023);
    mockArchiveService.calculateYearEndSummary.mockResolvedValue(mockSummary);

    const { result } = renderHook(() => useArchivePrompt());

    await waitFor(() => {
      expect(result.current.showPrompt).toBe(true);
    });

    act(() => {
      result.current.handleRemindLater();
    });

    expect(result.current.showPrompt).toBe(false);
  });

  it('should navigate and hide prompt when handleGoToSettings is called', async () => {
    const mockSummary = {
      transactionCount: 100,
      closingNetWorth: 50000,
      closingBalances: {},
      closingAssetValuations: {},
    };

    mockArchiveService.identifyArchivableYear.mockResolvedValue(2023);
    mockArchiveService.calculateYearEndSummary.mockResolvedValue(mockSummary);

    const { result } = renderHook(() => useArchivePrompt());

    await waitFor(() => {
      expect(result.current.showPrompt).toBe(true);
    });

    act(() => {
      result.current.handleGoToSettings();
    });

    expect(result.current.showPrompt).toBe(false);
  });

  it('should re-check archive when sync status changes', async () => {
    mockArchiveService.identifyArchivableYear.mockResolvedValue(null);

    const { rerender } = renderHook(() => useArchivePrompt());

    await waitFor(() => {
      expect(mockArchiveService.identifyArchivableYear).toHaveBeenCalledTimes(1);
    });

    // Change sync status
    mockUseSync.mockReturnValue({
      syncStatus: {
        status: 'syncing',
        errorMessage: null,
        providerName: 'OneDrive',
        fileName: 'test.json',
      },
      selectFile: jest.fn(),
      listItems: jest.fn(),
      fullSync: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    });

    rerender();

    await waitFor(() => {
      expect(mockArchiveService.identifyArchivableYear).toHaveBeenCalledTimes(2);
    });
  });
});
