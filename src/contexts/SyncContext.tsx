import { useLiveQuery } from 'dexie-react-hooks';
import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useApp } from '@/contexts/AppContext';
import { useServiceContext } from '@/contexts/ServiceContext';
import { db } from '@/db/database';
import { CloudItem, StorageProviderType } from '@/services/storage/IStorageProvider';

const FILE_CACHE_KEY = 'moneyTree.currentFile';

// Simplified sync status for UI display
export type SyncUIStatus =
  | 'offline' // Not ready to sync (no provider, no file, or auth expired)
  | 'connected' // Provider and file set, but not yet synced
  | 'syncing' // Currently syncing
  | 'synced' // Successfully synced
  | 'error'; // Sync error occurred

// State-only interface
export interface SyncState {
  currentFile: CloudItem | null;
  status: SyncUIStatus;
  errorMessage: string | null;
}

// Operations-only interface
export interface SyncOperations {
  // Connection lifecycle
  connect: (type: StorageProviderType) => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;

  // File operations
  selectFile: (fileItem: CloudItem) => Promise<void>;

  // Sync
  fullSync: () => Promise<void>;
}

// Combined context value
export interface SyncContextValue extends SyncState, SyncOperations {}

const SyncContext = createContext<SyncContextValue | null>(null);

const DEBOUNCE_MS = 15000; // 15 seconds for all syncs

// ==================== HELPER FUNCTIONS ====================

/**
 * Load cached file from localStorage
 */
function loadCachedFile(): CloudItem | null {
  try {
    const cached = localStorage.getItem(FILE_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as CloudItem;
  } catch (error) {
    console.warn('Failed to load cached file info:', error);
    return null;
  }
}

/**
 * Check if error is authentication-related and requires reconnection
 * Includes both auth errors and permission errors
 */
function isAuthenticationError(errorMessage: string): boolean {
  const lowerMessage = errorMessage.toLowerCase();
  return (
    lowerMessage.includes('authenticate') ||
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('grant access') ||
    lowerMessage.includes('expired')
  );
}

// ==================== TYPES ====================

interface SyncProviderProps {
  children: React.ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const { cloudService, cloudSyncService } = useServiceContext();
  const { showSnackbar, setShowWelcomeDialog, setShowFileSelection, setShowReconnectDialog } =
    useApp();

  const [syncState, setSyncState] = useState<SyncState>({
    currentFile: null,
    status: 'offline',
    errorMessage: null,
  });

  // Helper to update sync state
  const updateSyncState = useCallback((updates: Partial<SyncState>) => {
    setSyncState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Use refs for sync flags that don't need to trigger re-renders
  const syncStateRef = useRef({
    isInitialized: false,
    isSyncing: false,
    isInitializing: false,
    remoteLastModified: null as string | null,
  });

  // Initialize storage provider on first mount
  useEffect(() => {
    if (syncStateRef.current.isInitialized) return;
    syncStateRef.current.isInitialized = true;

    const initialize = async () => {
      try {
        syncStateRef.current.isSyncing = false;
        syncStateRef.current.isInitializing = true;

        const providerType = cloudService.getCurrentProvider();
        const cachedFile = loadCachedFile();
        const isAuthenticated = await cloudService.isAuthenticated();

        // No provider - new user flow
        if (!providerType) {
          setShowWelcomeDialog(true);
          return;
        }

        // Provider exists but not authenticated - show reconnect dialog
        if (!isAuthenticated) {
          setSyncState({
            currentFile: cachedFile,
            status: 'offline',
            errorMessage: null,
          });
          setShowReconnectDialog(true);
          return;
        }

        // Authenticated but no file - show file picker
        if (!cachedFile) {
          setSyncState({
            currentFile: null,
            status: 'offline',
            errorMessage: null,
          });
          setShowFileSelection(true);
          return;
        }

        // Happy path: authenticated and file loaded
        setSyncState({
          currentFile: cachedFile,
          status: 'connected',
          errorMessage: null,
        });
      } catch (error) {
        console.error('[SyncProvider] Initialization failed:', error);
        updateSyncState({ status: 'error', errorMessage: 'Initialization failed' });
        setShowWelcomeDialog(true);
      } finally {
        syncStateRef.current.isInitializing = false;
      }
    };

    void initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch lastModified timestamp for changes
  const lastModified = useLiveQuery(() =>
    db.syncMetadata.get('lastModified').then((r) => r?.value as string | undefined)
  );

  // Internal function to update file item without clearing DB (for sync updates)
  const updateFileItem = useCallback(
    (fileItem: CloudItem) => {
      try {
        localStorage.setItem(FILE_CACHE_KEY, JSON.stringify(fileItem));
      } catch (error) {
        console.warn('Failed to cache file info:', error);
      }
      updateSyncState({
        currentFile: fileItem,
        status: 'connected',
        errorMessage: null,
      });
    },
    [updateSyncState]
  );

  // Select file for syncing (resets DB only for existing remote files, not new files)
  const selectFile = useCallback(
    async (fileItem: CloudItem) => {
      // Only reset DB when opening an existing remote file
      // New files (id === '') should keep local data to upload
      if (fileItem.id) {
        await db.delete();
        await db.open();
      }

      updateFileItem(fileItem);
    },
    [updateFileItem]
  );

  // Connect to a storage provider
  const connect = useCallback(
    async (type: StorageProviderType): Promise<void> => {
      // Authenticate with CloudService (may redirect or return if already authenticated)
      await cloudService.connect(type);

      // If we reach here, no redirect happened (already authenticated)
      // Update state and show file selection
      updateSyncState({
        status: 'offline',
        errorMessage: null,
      });
      setShowFileSelection(true);
    },
    [cloudService, updateSyncState, setShowFileSelection]
  );

  // Disconnect from storage provider
  const disconnect = useCallback(async (): Promise<void> => {
    await cloudService.disconnect();
    localStorage.removeItem(FILE_CACHE_KEY);
    setSyncState({
      currentFile: null,
      status: 'offline',
      errorMessage: null,
    });
    setShowWelcomeDialog(true);
  }, [cloudService, setShowWelcomeDialog]);

  // Reconnect when in offline mode
  const reconnect = useCallback(async () => {
    const providerType = cloudService.getCurrentProvider();
    if (!providerType) {
      // No cached provider → show welcome dialog
      setShowWelcomeDialog(true);
      return;
    }

    // Re-authenticate (may redirect or return if already authenticated)
    await cloudService.reconnect();

    // If we reach here, no redirect happened (already authenticated)
    // Check for cached file and update state accordingly
    const cachedFile = loadCachedFile();
    if (!cachedFile) {
      // No file cached → show file picker (stay offline until file selected)
      setShowFileSelection(true);
    } else {
      // Has file → ready to sync
      setSyncState({
        currentFile: cachedFile,
        status: 'connected',
        errorMessage: null,
      });
    }
  }, [cloudService, setShowWelcomeDialog, setShowFileSelection]);

  // Full bidirectional sync
  const fullSync = useCallback(async (): Promise<void> => {
    if (syncState.status === 'offline') {
      showSnackbar('Cannot sync while offline. Click sync to reconnect.', 'info');
      return;
    }

    if (!syncState.currentFile) {
      throw new Error('No file selected for sync');
    }
    if (syncStateRef.current.isSyncing) {
      return;
    }

    // Safety check: Skip if already synced to current timestamp
    if (lastModified && lastModified === syncStateRef.current.remoteLastModified) {
      return;
    }

    try {
      syncStateRef.current.isSyncing = true;
      updateSyncState({ status: 'syncing', errorMessage: null });

      const result = await cloudSyncService.fullSync(syncState.currentFile);
      syncStateRef.current.remoteLastModified = result.mergedLastModified;
      updateSyncState({ status: 'synced', errorMessage: null });

      if (result.fileItem.id !== syncState.currentFile!.id) {
        updateFileItem(result.fileItem);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to sync with cloud';
      console.error('[SyncProvider] Sync failed:', error, {
        errorMessage: errorMsg,
        timestamp: new Date().toISOString(),
      });

      // Detect authentication/permission errors and transition to offline mode
      if (isAuthenticationError(errorMsg)) {
        updateSyncState({ status: 'offline', errorMessage: errorMsg });
        showSnackbar(`${errorMsg}. Click sync to reconnect.`, 'info');
      } else {
        updateSyncState({ status: 'error', errorMessage: errorMsg });
        showSnackbar(errorMsg, 'warning');
      }
    } finally {
      syncStateRef.current.isSyncing = false;
    }
  }, [
    lastModified,
    syncState.status,
    syncState.currentFile,
    cloudSyncService,
    updateSyncState,
    updateFileItem,
    showSnackbar,
  ]);

  // Debounced sync using useDebouncedCallback
  const debouncedSync = useDebouncedCallback(
    async () => {
      if (!syncState.currentFile) return;
      await fullSync();
    },
    DEBOUNCE_MS,
    { leading: false, trailing: true }
  );

  // Auto-sync when connection established or file changes
  useEffect(() => {
    if (!syncState.currentFile) return;

    fullSync().catch((err) => {
      console.error('[SyncProvider] Initial sync error:', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncState.currentFile]);

  // Auto-sync whenever lastModified changes (only for subsequent changes after initial sync)
  useEffect(() => {
    if (
      !cloudService.getCurrentProvider() ||
      !syncState.currentFile ||
      !lastModified ||
      syncStateRef.current.isInitializing
    ) {
      return;
    }

    // Don't trigger debounced sync if we haven't established the remote state yet
    // (initial sync will handle it)
    if (!syncStateRef.current.remoteLastModified) {
      return;
    }

    // Don't sync if already synced to this timestamp
    if (lastModified === syncStateRef.current.remoteLastModified) {
      return;
    }

    // Only update to 'connected' if currently 'synced' (indicates new local changes)
    setSyncState((prev) => {
      if (prev.status === 'synced') {
        return { ...prev, status: 'connected' };
      }
      return prev;
    });

    debouncedSync();
  }, [lastModified, cloudService, syncState.currentFile, debouncedSync]);

  const value: SyncContextValue = {
    ...syncState,
    selectFile,
    fullSync,
    reconnect,
    connect,
    disconnect,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = (): SyncContextValue => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
};

// Export utilities
export { StorageProviderType };
