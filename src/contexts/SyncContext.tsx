import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDebouncedCallback } from 'use-debounce';
import { CloudSyncService } from '@/services/cloudSync.service';
import { IStorageProvider, CloudItem } from '@/services/storage/IStorageProvider';
import { OneDriveProvider } from '@/services/storage/OneDriveProvider';
import { isOneDriveConfigured } from '@/config/onedrive.config';
import { useApp } from '@/contexts/AppContext';
import { db } from '@/db/database';

/**
 * Storage provider type
 */
export enum StorageProviderType {
  ONEDRIVE = 'onedrive',
}

const FILE_CACHE_KEY = 'moneyTree.currentFile';
const STORAGE_CONFIG_KEY = 'moneyTree.storageProviderConfig';

// Simplified sync status for UI display
export type SyncUIStatus =
  | 'offline' // Not ready to sync (no provider, no file, or auth expired)
  | 'connected' // Provider and file set, but not yet synced
  | 'syncing' // Currently syncing
  | 'synced' // Successfully synced
  | 'error'; // Sync error occurred

// State-only interface
export interface SyncState {
  provider: IStorageProvider | null;
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

const DEBOUNCE_MS = 30000; // 30 seconds for all syncs

// ==================== HELPER FUNCTIONS ====================

/**
 * Create provider instance based on type
 * Returns null if the provider is not properly configured
 */
function createProvider(type: StorageProviderType): IStorageProvider | null {
  switch (type) {
    case StorageProviderType.ONEDRIVE:
      return isOneDriveConfigured() ? new OneDriveProvider() : null;
    default:
      return null;
  }
}

/**
 * Load stored provider configuration
 */
function loadProviderConfig(): StorageProviderType | null {
  const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
  return saved as StorageProviderType | null;
}

/**
 * Save provider configuration
 */
function saveProviderConfig(type: StorageProviderType): void {
  localStorage.setItem(STORAGE_CONFIG_KEY, type);
}

/**
 * Clear provider configuration
 */
function clearProviderConfig(): void {
  localStorage.removeItem(STORAGE_CONFIG_KEY);
}

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
  const { showSnackbar, setShowWelcomeDialog, setShowFileSelection, setShowReconnectDialog } =
    useApp();

  const [syncState, setSyncState] = useState<SyncState>({
    provider: null,
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

        // Guard: No stored config - new user flow
        const config = loadProviderConfig();
        if (!config) {
          setShowWelcomeDialog(true);
          return;
        }

        // Guard: Invalid provider type
        const providerInstance = createProvider(config);
        if (!providerInstance) {
          showSnackbar('Session expired - working offline. Click sync to reconnect.', 'info');
          return;
        }

        // Check if provider is authenticated
        const isAuthenticated = await providerInstance.initialize();

        // Try to load cached file
        const cachedFile = loadCachedFile();

        // Handle authentication + file state combinations
        if (!isAuthenticated && cachedFile) {
          // Auth expired but file exists (Safari case: sessionStorage cleared, localStorage persists)
          setSyncState({
            provider: providerInstance,
            currentFile: cachedFile,
            status: 'offline',
            errorMessage: null,
          });
          setShowReconnectDialog(true);
          return;
        }

        if (!isAuthenticated && !cachedFile) {
          setShowWelcomeDialog(true);
          return;
        }

        if (!cachedFile) {
          // Authenticated but no file selected yet - show file selection
          setSyncState({
            provider: providerInstance,
            currentFile: null,
            status: 'offline',
            errorMessage: null,
          });
          setShowFileSelection(true);
          return;
        }

        // Happy path: Authenticated and file loaded
        setSyncState({
          provider: providerInstance,
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

  // Create sync service
  const syncService = useMemo(() => {
    if (!syncState.provider || !syncState.currentFile) {
      return null;
    }
    return new CloudSyncService(syncState.provider, syncState.currentFile, db);
  }, [syncState.provider, syncState.currentFile]);

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

  // Select file for syncing (clears DB for fresh start)
  const selectFile = useCallback(
    async (fileItem: CloudItem) => {
      await db.delete();
      await db.open();

      updateFileItem(fileItem);
    },
    [updateFileItem]
  );

  // Connect to a storage provider
  const connect = useCallback(
    async (type: StorageProviderType): Promise<void> => {
      const providerInstance = createProvider(type);
      if (!providerInstance) {
        throw new Error(`Provider not available: ${type}`);
      }

      // Save provider type to localStorage BEFORE redirect
      saveProviderConfig(type);

      // Authenticate (may redirect or return if already authenticated)
      await providerInstance.authenticate();

      // If we reach here, no redirect happened (already authenticated)
      // Continue with the flow: update state and show file selection
      updateSyncState({
        provider: providerInstance,
        status: 'offline',
        errorMessage: null,
      });
      setShowFileSelection(true);
    },
    [updateSyncState, setShowFileSelection]
  );

  // Disconnect from storage provider
  const disconnect = useCallback(async (): Promise<void> => {
    clearProviderConfig();
    localStorage.removeItem(FILE_CACHE_KEY);
    setSyncState({
      provider: null,
      currentFile: null,
      status: 'offline',
      errorMessage: null,
    });
    setShowWelcomeDialog(true);
  }, [setShowWelcomeDialog]);

  // Reconnect when in offline mode
  const reconnect = useCallback(async () => {
    const config = loadProviderConfig();
    if (!config) {
      // No cached config → show welcome dialog to connect from scratch
      setShowWelcomeDialog(true);
      return;
    }

    const providerInstance = createProvider(config);
    if (!providerInstance) {
      // Provider not configured → show welcome dialog
      setShowWelcomeDialog(true);
      return;
    }

    // Re-authenticate (may redirect or return if already authenticated)
    await providerInstance.authenticate();

    // If we reach here, no redirect happened (already authenticated)
    // Check for cached file and update state accordingly
    const cachedFile = loadCachedFile();
    if (!cachedFile) {
      // No file cached → show file picker (stay offline until file selected)
      updateSyncState({ provider: providerInstance });
      setShowFileSelection(true);
    } else {
      // Has file → ready to sync
      setSyncState({
        provider: providerInstance,
        currentFile: cachedFile,
        status: 'connected',
        errorMessage: null,
      });
    }
  }, [updateSyncState, setShowWelcomeDialog, setShowFileSelection]);

  // Full bidirectional sync
  const fullSync = useCallback(async (): Promise<void> => {
    if (syncState.status === 'offline') {
      showSnackbar('Cannot sync while offline. Click sync to reconnect.', 'info');
      return;
    }

    if (!syncService) {
      throw new Error('Sync service not initialized or no file selected');
    }
    if (syncStateRef.current.isSyncing) {
      return;
    }

    try {
      syncStateRef.current.isSyncing = true;
      updateSyncState({ status: 'syncing', errorMessage: null });

      const result = await syncService.fullSync();
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
    syncState.status,
    syncState.currentFile,
    syncService,
    updateSyncState,
    updateFileItem,
    showSnackbar,
  ]);

  // Debounced sync using useDebouncedCallback
  const debouncedSync = useDebouncedCallback(
    async () => {
      if (!syncService) return;
      await fullSync();
    },
    DEBOUNCE_MS,
    { leading: false, trailing: true }
  );

  // Auto-sync when connection established or file changes
  useEffect(() => {
    if (!syncService) return;

    fullSync().catch((err) => {
      console.error('[SyncProvider] Initial sync error:', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncService]);

  // Auto-sync whenever lastModified changes (only for subsequent changes after initial sync)
  useEffect(() => {
    if (
      !syncState.provider ||
      !syncState.currentFile ||
      !lastModified ||
      syncStateRef.current.isInitializing
    )
      return;

    // Don't trigger debounced sync if we haven't established the remote state yet
    // (initial sync will handle it)
    if (!syncStateRef.current.remoteLastModified) return;

    // Don't sync if already synced to this timestamp
    if (lastModified === syncStateRef.current.remoteLastModified) {
      return;
    }

    // Only update to 'connected' if currently 'synced' (indicates new local changes)
    if (syncState.status === 'synced') {
      updateSyncState({ status: 'connected' });
    }

    debouncedSync();
  }, [
    lastModified,
    syncState.provider,
    syncState.currentFile,
    syncState.status,
    debouncedSync,
    updateSyncState,
  ]);

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
