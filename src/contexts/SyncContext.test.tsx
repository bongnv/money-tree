import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { StorageProviderType, type CloudItem } from '@/services/storage/IStorageProvider';

// Mock services
const mockCloudService = {
  initialize: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  reconnect: jest.fn(),
  getCurrentProvider: jest.fn(),
  isAuthenticated: jest.fn(),
  listFiles: jest.fn(),
};

const mockCloudSyncService = {
  fullSync: jest.fn(),
};

// Mock database
jest.mock('@/db/database', () => ({
  db: {
    delete: jest.fn().mockResolvedValue(undefined),
    open: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock dexie-react-hooks
jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: jest.fn(() => '2024-01-01T00:00:00.000Z'),
}));

// Mock use-debounce
jest.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: (...args: unknown[]) => unknown) => fn,
}));

// Mock AppContext
jest.mock('./AppContext', () => ({
  useApp: jest.fn(),
}));

// Mock ServiceContext
jest.mock('./ServiceContext', () => ({
  useServiceContext: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Import after mocks
import { SyncProvider, useSync } from './SyncContext';
import { useApp } from './AppContext';
import { useServiceContext } from './ServiceContext';

const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;
const mockUseServiceContext = useServiceContext as jest.MockedFunction<typeof useServiceContext>;

describe('SyncContext', () => {
  const mockShowSnackbar = jest.fn();
  const mockSetShowWelcomeDialog = jest.fn();
  const mockSetShowFileSelection = jest.fn();
  const mockSetShowReconnectDialog = jest.fn();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SyncProvider>{children}</SyncProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockCloudService.getCurrentProvider.mockReturnValue(null);
    mockCloudService.isAuthenticated.mockResolvedValue(false);

    // Setup context mocks
    mockUseApp.mockReturnValue({
      showSnackbar: mockShowSnackbar,
      setShowWelcomeDialog: mockSetShowWelcomeDialog,
      setShowFileSelection: mockSetShowFileSelection,
      setShowReconnectDialog: mockSetShowReconnectDialog,
    } as unknown as ReturnType<typeof useApp>);

    mockUseServiceContext.mockReturnValue({
      cloudService: mockCloudService,
      cloudSyncService: mockCloudSyncService,
    } as unknown as ReturnType<typeof useServiceContext>);
  });

  describe('Initialization', () => {
    it('should show welcome dialog for new users', async () => {
      mockCloudService.getCurrentProvider.mockReturnValue(null);

      renderHook(() => useSync(), { wrapper });

      await waitFor(() => {
        expect(mockSetShowWelcomeDialog).toHaveBeenCalledWith(true);
      });
    });

    it('should show reconnect dialog when provider exists but not authenticated', async () => {
      mockCloudService.getCurrentProvider.mockReturnValue(StorageProviderType.ONEDRIVE);
      mockCloudService.isAuthenticated.mockResolvedValue(false);

      renderHook(() => useSync(), { wrapper });

      await waitFor(() => {
        expect(mockSetShowReconnectDialog).toHaveBeenCalledWith(true);
      });
    });

    it('should show file selection when authenticated but no file', async () => {
      mockCloudService.getCurrentProvider.mockReturnValue(StorageProviderType.ONEDRIVE);
      mockCloudService.isAuthenticated.mockResolvedValue(true);

      renderHook(() => useSync(), { wrapper });

      await waitFor(() => {
        expect(mockSetShowFileSelection).toHaveBeenCalledWith(true);
      });
    });

    it('should trigger sync when authenticated with cached file', async () => {
      const mockFile = { id: 'file1', name: 'data.json', isFolder: false };
      localStorageMock.setItem('moneyTree.currentFile', JSON.stringify(mockFile));

      mockCloudService.getCurrentProvider.mockReturnValue(StorageProviderType.ONEDRIVE);
      mockCloudService.isAuthenticated.mockResolvedValue(true);
      mockCloudSyncService.fullSync.mockResolvedValue({
        mergedLastModified: '2024-01-01T00:00:00.000Z',
        fileItem: mockFile,
      });

      renderHook(() => useSync(), { wrapper });

      await waitFor(() => {
        expect(mockCloudSyncService.fullSync).toHaveBeenCalled();
      });
    });
  });

  describe('connect', () => {
    it('should connect to cloud provider and show file selection', async () => {
      mockCloudService.connect.mockResolvedValue(undefined);
      mockCloudService.getCurrentProvider.mockReturnValue(null);

      const { result } = renderHook(() => useSync(), { wrapper });

      await act(async () => {
        await result.current.connect(StorageProviderType.ONEDRIVE);
      });

      expect(mockCloudService.connect).toHaveBeenCalledWith(StorageProviderType.ONEDRIVE);
      expect(mockSetShowFileSelection).toHaveBeenCalledWith(true);
    });

    it('should handle connection errors', async () => {
      mockCloudService.connect.mockRejectedValue(new Error('Connection failed'));
      mockCloudService.getCurrentProvider.mockReturnValue(null);

      const { result } = renderHook(() => useSync(), { wrapper });

      await act(async () => {
        try {
          await result.current.connect(StorageProviderType.ONEDRIVE);
        } catch {
          // Expected to throw
        }
      });

      // Connection errors are thrown, not stored in state
      expect(mockCloudService.connect).toHaveBeenCalledWith(StorageProviderType.ONEDRIVE);
    });
  });

  describe('disconnect', () => {
    it('should disconnect from provider and clear file cache', async () => {
      const mockFile = { id: 'file1', name: 'data.json', isFolder: false };
      localStorageMock.setItem('moneyTree.currentFile', JSON.stringify(mockFile));

      mockCloudService.disconnect.mockResolvedValue(undefined);
      mockCloudService.getCurrentProvider.mockReturnValue(StorageProviderType.ONEDRIVE);

      const { result } = renderHook(() => useSync(), { wrapper });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(mockCloudService.disconnect).toHaveBeenCalled();
      expect(localStorageMock.getItem('moneyTree.currentFile')).toBeNull();
      expect(result.current.status).toBe('offline');
      expect(result.current.currentFile).toBeNull();
    });
  });

  describe('reconnect', () => {
    it('should reconnect to provider', async () => {
      const mockFile = { id: 'file1', name: 'data.json', isFolder: false };
      localStorageMock.setItem('moneyTree.currentFile', JSON.stringify(mockFile));
      
      mockCloudService.reconnect.mockResolvedValue(undefined);
      mockCloudService.getCurrentProvider.mockReturnValue(StorageProviderType.ONEDRIVE);
      mockCloudSyncService.fullSync.mockResolvedValue({
        mergedLastModified: '2024-01-01T00:00:00.000Z',
        fileItem: mockFile,
      });

      const { result } = renderHook(() => useSync(), { wrapper });

      await act(async () => {
        await result.current.reconnect();
      });

      expect(mockCloudService.reconnect).toHaveBeenCalled();
      // After reconnect with a file, it should trigger sync and become 'synced' or 'connected'
      expect(['connected', 'synced', 'syncing']).toContain(result.current.status);
    });

    it('should handle reconnection errors', async () => {
      mockCloudService.reconnect.mockRejectedValue(new Error('Reconnect failed'));
      mockCloudService.getCurrentProvider.mockReturnValue(StorageProviderType.ONEDRIVE);

      const { result } = renderHook(() => useSync(), { wrapper });

      await act(async () => {
        try {
          await result.current.reconnect();
        } catch {
          // Expected to throw
        }
      });

      expect(mockCloudService.reconnect).toHaveBeenCalled();
    });
  });

  describe('selectFile', () => {
    it('should select file and trigger sync', async () => {
      const mockFile = { id: 'file1', name: 'data.json', isFolder: false };
      
      mockCloudService.getCurrentProvider.mockReturnValue(StorageProviderType.ONEDRIVE);
      mockCloudService.isAuthenticated.mockResolvedValue(true);
      mockCloudSyncService.fullSync.mockResolvedValue({
        mergedLastModified: '2024-01-01T00:00:00.000Z',
        fileItem: mockFile,
      });

      const { result } = renderHook(() => useSync(), { wrapper });

      await act(async () => {
        await result.current.selectFile(mockFile);
      });

      expect(localStorageMock.getItem('moneyTree.currentFile')).toBeTruthy();
      expect(mockCloudSyncService.fullSync).toHaveBeenCalledWith(mockFile);
      expect(result.current.currentFile).toEqual(mockFile);
      expect(result.current.status).toBe('synced');
    });

    it('should handle file selection errors', async () => {
      const mockFile = { id: 'file1', name: 'data.json', isFolder: false };
      
      mockCloudService.getCurrentProvider.mockReturnValue(StorageProviderType.ONEDRIVE);
      mockCloudSyncService.fullSync.mockRejectedValue(new Error('Sync failed'));

      const { result } = renderHook(() => useSync(), { wrapper });

      await act(async () => {
        await result.current.selectFile(mockFile);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
    });
  });

  describe('fullSync', () => {
    it('should perform full sync when file is set', async () => {
      const mockFile = { id: 'file1', name: 'data.json', isFolder: false };
      localStorageMock.setItem('moneyTree.currentFile', JSON.stringify(mockFile));

      mockCloudService.getCurrentProvider.mockReturnValue(StorageProviderType.ONEDRIVE);
      mockCloudService.isAuthenticated.mockResolvedValue(true);
      mockCloudSyncService.fullSync.mockResolvedValue({
        mergedLastModified: '2024-01-01T00:00:00.000Z',
        fileItem: mockFile,
      });

      const { result } = renderHook(() => useSync(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentFile).toBeTruthy();
      });

      await act(async () => {
        await result.current.fullSync();
      });

      expect(mockCloudSyncService.fullSync).toHaveBeenCalled();
      expect(result.current.status).toBe('synced');
    });

    it('should not sync when no file is selected', async () => {
      mockCloudService.getCurrentProvider.mockReturnValue(StorageProviderType.ONEDRIVE);

      const { result } = renderHook(() => useSync(), { wrapper });

      await act(async () => {
        await result.current.fullSync();
      });

      expect(mockCloudSyncService.fullSync).not.toHaveBeenCalled();
    });

    it('should handle authentication errors and set offline status', async () => {
      const mockFile = { id: 'file1', name: 'data.json', isFolder: false };
      localStorageMock.setItem('moneyTree.currentFile', JSON.stringify(mockFile));

      mockCloudService.getCurrentProvider.mockReturnValue(StorageProviderType.ONEDRIVE);
      mockCloudService.isAuthenticated.mockResolvedValue(true);
      mockCloudSyncService.fullSync.mockRejectedValue(new Error('Authentication failed'));

      const { result } = renderHook(() => useSync(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentFile).toBeTruthy();
      });

      await act(async () => {
        await result.current.fullSync();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('offline');
        expect(result.current.errorMessage).toContain('Authentication failed');
        expect(mockShowSnackbar).toHaveBeenCalledWith(
          expect.stringContaining('Authentication failed'),
          'info'
        );
      }, { timeout: 3000 });
    });
  });

  describe('Status management', () => {
    it('should start with offline status', () => {
      mockCloudService.getCurrentProvider.mockReturnValue(null);
      
      const { result } = renderHook(() => useSync(), { wrapper });

      expect(result.current.status).toBe('offline');
    });

    it('should transition to syncing during sync', async () => {
      const mockFile = { id: 'file1', name: 'data.json', isFolder: false };
      localStorageMock.setItem('moneyTree.currentFile', JSON.stringify(mockFile));

      mockCloudService.getCurrentProvider.mockReturnValue(StorageProviderType.ONEDRIVE);
      mockCloudService.isAuthenticated.mockResolvedValue(true);
      
      let resolveSync!: (value: { mergedLastModified: string; fileItem: CloudItem }) => void;
      const syncPromise = new Promise<{ mergedLastModified: string; fileItem: CloudItem }>((resolve) => {
        resolveSync = resolve;
      });
      mockCloudSyncService.fullSync.mockReturnValue(syncPromise);

      const { result } = renderHook(() => useSync(), { wrapper });

      await waitFor(() => {
        expect(result.current.status).toBe('syncing');
      });

      resolveSync({
        mergedLastModified: '2024-01-01T00:00:00.000Z',
        fileItem: mockFile,
      });

      await waitFor(() => {
        expect(result.current.status).toBe('synced');
      });
    });
  });
});
