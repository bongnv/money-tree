/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { useDataSyncSettings } from './useDataSyncSettings';
import { useSync } from '@/contexts/SyncContext';
import { useStore } from '@/contexts/StoreContext';
import { useFormatService, useCloudService } from '@/contexts/ServiceContext';
import { db } from '@/db/database';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('@/contexts/SyncContext');
jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/ServiceContext');
jest.mock('@/db/database', () => ({
  db: {
    delete: jest.fn().mockResolvedValue(undefined),
    open: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockUseSync = useSync as jest.MockedFunction<typeof useSync>;
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseFormatService = useFormatService as jest.MockedFunction<typeof useFormatService>;
const mockUseCloudService = useCloudService as jest.MockedFunction<typeof useCloudService>;

describe('useDataSyncSettings', () => {
  const mockDisconnect = jest.fn().mockResolvedValue(undefined);
  const mockReconnect = jest.fn().mockResolvedValue(undefined);
  const mockCalculateDataSize = jest.fn().mockReturnValue('1.5 KB');
  const mockGetProviderName = jest.fn().mockReturnValue('OneDrive');

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSync.mockReturnValue({
      currentFile: { id: 'file-1', name: 'money-tree.json', parentItemId: 'folder-1' },
      status: 'synced',
      disconnect: mockDisconnect,
      reconnect: mockReconnect,
    } as any);

    mockUseStore.mockReturnValue({
      accounts: [],
      categories: [],
      transactionTypes: [],
      transactions: [],
      budgets: [],
      assets: [],
    } as any);

    mockUseFormatService.mockReturnValue({
      calculateDataSize: mockCalculateDataSize,
    } as any);

    mockUseCloudService.mockReturnValue({
      getProviderName: mockGetProviderName,
    } as any);
  });

  it('should return cloud file name from current file', () => {
    const { result } = renderHook(() => useDataSyncSettings());

    expect(result.current.cloudFileName).toBe('money-tree.json');
  });

  it('should return null cloud file name when no file', () => {
    mockUseSync.mockReturnValue({
      currentFile: null,
      status: 'connected',
      disconnect: mockDisconnect,
      reconnect: mockReconnect,
    } as any);

    const { result } = renderHook(() => useDataSyncSettings());

    expect(result.current.cloudFileName).toBeNull();
  });

  it('should calculate file size', () => {
    const { result } = renderHook(() => useDataSyncSettings());

    expect(result.current.fileSize).toBe('1.5 KB');
    expect(mockCalculateDataSize).toHaveBeenCalledWith({
      accounts: [],
      categories: [],
      transactionTypes: [],
      transactions: [],
      budgets: [],
      assets: [],
    });
  });

  it('should return storage location from cloud service', () => {
    const { result } = renderHook(() => useDataSyncSettings());

    expect(result.current.storageLocation).toBe('OneDrive');
  });

  it('should return "Not connected" when no provider', () => {
    mockGetProviderName.mockReturnValue(null);

    const { result } = renderHook(() => useDataSyncSettings());

    expect(result.current.storageLocation).toBe('Not connected');
  });

  it('should return isOffline correctly', () => {
    const { result } = renderHook(() => useDataSyncSettings());
    expect(result.current.isOffline).toBe(false);

    mockUseSync.mockReturnValue({
      currentFile: null,
      status: 'offline',
      disconnect: mockDisconnect,
      reconnect: mockReconnect,
    } as any);

    const { result: result2 } = renderHook(() => useDataSyncSettings());
    expect(result2.current.isOffline).toBe(true);
  });

  it('should manage disconnect dialog state', () => {
    const { result } = renderHook(() => useDataSyncSettings());

    expect(result.current.disconnectDialogOpen).toBe(false);

    act(() => {
      result.current.openDisconnectDialog();
    });

    expect(result.current.disconnectDialogOpen).toBe(true);

    act(() => {
      result.current.closeDisconnectDialog();
    });

    expect(result.current.disconnectDialogOpen).toBe(false);
  });

  it('should call reconnect on handleReconnect', async () => {
    const { result } = renderHook(() => useDataSyncSettings());

    await act(async () => {
      await result.current.handleReconnect();
    });

    expect(mockReconnect).toHaveBeenCalledTimes(1);
  });

  it('should handle disconnect correctly', async () => {
    const { result } = renderHook(() => useDataSyncSettings());

    // Open dialog first
    act(() => {
      result.current.openDisconnectDialog();
    });

    await act(async () => {
      await result.current.handleDisconnect();
    });

    // Should close dialog
    expect(result.current.disconnectDialogOpen).toBe(false);
    // Should clear DB
    expect(db.delete).toHaveBeenCalled();
    expect(db.open).toHaveBeenCalled();
    // Should disconnect
    expect(mockDisconnect).toHaveBeenCalled();
    // Should navigate to dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
