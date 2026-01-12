import { renderHook, act } from '@testing-library/react';
import { useAppStore } from './useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    localStorage.clear();
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.resetState();
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAppStore());

    expect(result.current.fileName).toBeNull();
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should mark changes as unsaved', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setUnsavedChanges(true);
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('should set file name and persist to storage', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setFileName('money-tree-2024.json');
    });

    expect(result.current.fileName).toBe('money-tree-2024.json');
  });

  it('should clear file name when set to null', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setFileName('test.json');
      result.current.setFileName(null);
    });

    expect(result.current.fileName).toBeNull();
  });

  it('should set unsaved changes flag and persist to storage', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setUnsavedChanges(true);
    });

    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => {
      result.current.setUnsavedChanges(false);
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should set error message', () => {
    const { result } = renderHook(() => useAppStore());
    const errorMessage = 'Test error';

    act(() => {
      result.current.setError(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBeNull();
  });

  it('should mark as saved with timestamp', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setUnsavedChanges(true);
      result.current.markAsSaved();
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.lastSaved).toBeTruthy();
  });

  it('should reset state and clear storage', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setFileName('test.json');
      result.current.setUnsavedChanges(true);
      result.current.setLoading(true);
      result.current.setError('error');
      result.current.resetState();
    });

    expect(result.current.fileName).toBeNull();
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
