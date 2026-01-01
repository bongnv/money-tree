import { renderHook, act } from '@testing-library/react';
import { useAppStore } from './useAppStore';
import { storageService } from '../services/storage.service';

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

    expect(result.current.currentYear).toBe(new Date().getFullYear());
    expect(result.current.dataFile).toBeNull();
    expect(result.current.fileName).toBeNull();
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set current year and persist to storage', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setCurrentYear(2024);
    });

    expect(result.current.currentYear).toBe(2024);
    expect(storageService.getCurrentYear()).toBe(2024);
  });

  it('should set data file and mark as unsaved', () => {
    const { result } = renderHook(() => useAppStore());
    const mockDataFile = {
      version: '1.0.0',
      year: 2024,
      accounts: [],
      categories: [],
      transactionTypes: [],
      transactions: [],
      budgets: [],
      lastModified: new Date().toISOString(),
    };

    act(() => {
      result.current.setDataFile(mockDataFile);
    });

    expect(result.current.dataFile).toEqual(mockDataFile);
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(storageService.getUnsavedChanges()).toBe(true);
  });

  it('should set file name and persist to storage', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setFileName('money-tree-2024.json');
    });

    expect(result.current.fileName).toBe('money-tree-2024.json');
    expect(storageService.getFileName()).toBe('money-tree-2024.json');
  });

  it('should clear file name when set to null', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setFileName('test.json');
      result.current.setFileName(null);
    });

    expect(result.current.fileName).toBeNull();
    expect(storageService.getFileName()).toBeNull();
  });

  it('should set last saved timestamp and persist to storage', () => {
    const { result } = renderHook(() => useAppStore());
    const timestamp = new Date().toISOString();

    act(() => {
      result.current.setLastSaved(timestamp);
    });

    expect(result.current.lastSaved).toBe(timestamp);
    expect(storageService.getLastSaved()).toBe(timestamp);
  });

  it('should set unsaved changes flag and persist to storage', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setUnsavedChanges(true);
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(storageService.getUnsavedChanges()).toBe(true);

    act(() => {
      result.current.setUnsavedChanges(false);
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(storageService.getUnsavedChanges()).toBe(false);
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
    expect(storageService.getUnsavedChanges()).toBe(false);
    expect(storageService.getLastSaved()).toBeTruthy();
  });

  it('should reset state and clear storage', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setCurrentYear(2024);
      result.current.setFileName('test.json');
      result.current.setUnsavedChanges(true);
      result.current.setLoading(true);
      result.current.setError('error');
      result.current.resetState();
    });

    expect(result.current.currentYear).toBe(new Date().getFullYear());
    expect(result.current.dataFile).toBeNull();
    expect(result.current.fileName).toBeNull();
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(storageService.getCurrentYear()).toBeNull();
  });
});

