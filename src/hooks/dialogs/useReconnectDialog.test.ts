/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { useReconnectDialog } from './useReconnectDialog';
import { useSync } from '@/contexts/SyncContext';
import { useApp } from '@/contexts/AppContext';

jest.mock('@/contexts/SyncContext');
jest.mock('@/contexts/AppContext');

const mockUseSync = useSync as jest.MockedFunction<typeof useSync>;
const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;

describe('useReconnectDialog', () => {
  const mockReconnect = jest.fn();
  const mockSetShowReconnectDialog = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSync.mockReturnValue({
      reconnect: mockReconnect,
    } as any);
    mockUseApp.mockReturnValue({
      setShowReconnectDialog: mockSetShowReconnectDialog,
    } as any);
  });

  it('should return initial state with no error', () => {
    const { result } = renderHook(() => useReconnectDialog());

    expect(result.current.error).toBeNull();
    expect(result.current.handleReconnect).toBeDefined();
    expect(result.current.handleCancel).toBeDefined();
  });

  it('should call reconnect and close dialog on successful reconnect', async () => {
    mockReconnect.mockResolvedValue(undefined);

    const { result } = renderHook(() => useReconnectDialog());

    await act(async () => {
      await result.current.handleReconnect();
    });

    expect(mockReconnect).toHaveBeenCalledTimes(1);
    expect(mockSetShowReconnectDialog).toHaveBeenCalledWith(false);
    expect(result.current.error).toBeNull();
  });

  it('should set error message when reconnect fails with Error', async () => {
    mockReconnect.mockRejectedValue(new Error('Connection timed out'));

    const { result } = renderHook(() => useReconnectDialog());

    await act(async () => {
      await result.current.handleReconnect();
    });

    expect(result.current.error).toBe('Connection timed out');
    expect(mockSetShowReconnectDialog).not.toHaveBeenCalled();
  });

  it('should set default error message when reconnect fails with non-Error', async () => {
    mockReconnect.mockRejectedValue('some string error');

    const { result } = renderHook(() => useReconnectDialog());

    await act(async () => {
      await result.current.handleReconnect();
    });

    expect(result.current.error).toBe('Failed to reconnect');
  });

  it('should close dialog and clear error on cancel', () => {
    const { result } = renderHook(() => useReconnectDialog());

    act(() => {
      result.current.handleCancel();
    });

    expect(mockSetShowReconnectDialog).toHaveBeenCalledWith(false);
    expect(result.current.error).toBeNull();
  });

  it('should clear previous error on new reconnect attempt', async () => {
    mockReconnect
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useReconnectDialog());

    // First attempt - fails
    await act(async () => {
      await result.current.handleReconnect();
    });
    expect(result.current.error).toBe('First failure');

    // Second attempt - succeeds, error should be cleared
    await act(async () => {
      await result.current.handleReconnect();
    });
    expect(result.current.error).toBeNull();
  });
});
