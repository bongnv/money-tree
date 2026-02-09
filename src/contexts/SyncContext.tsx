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
import { GoogleDriveProvider } from '@/services/storage/GoogleDriveProvider';
import { isOneDriveConfigured } from '@/config/onedrive.config';
import { isGoogleDriveConfigured } from '@/config/googledrive.config';
import { useApp } from '@/contexts/AppContext';
import { db } from '@/db/database';

/**
 * Storage provider type
 */
export enum StorageProviderType {
  ONEDRIVE = 'onedrive',
  GOOGLE_DRIVE = 'google_drive',
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

interface SyncStatusState {
  status: SyncUIStatus;
  errorMessage: string | null;
  providerName: string | null;
  fileName: string | null;
}

export interface SyncOperations {
  // File management
  selectFile: (fileItem: CloudItem) => Promise<void>;
  listItems: (parent?: CloudItem) => Promise<CloudItem[]>;

  // Sync methods
  fullSync: () => Promise<void>;
  reconnect: () => Promise<void>;

  // Connection methods
  connect: (type: StorageProviderType) => Promise<void>;
  disconnect: () => Promise<void>;

  // Status
  syncStatus: SyncStatusState;

  // Storage provider access
  provider: IStorageProvider | null;
  currentFile: CloudItem | null;
}

interface SyncContextValue extends SyncOperations {
  provider: IStorageProvider | null;
  currentFile: CloudItem | null;
}

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
    case StorageProviderType.GOOGLE_DRIVE:
      return isGoogleDriveConfigured() ? new GoogleDriveProvider() : null;
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
  const [provider, setProvider] = useState<IStorageProvider | null>(null);
  const [currentFile, setCurrentFile] = useState<CloudItem | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusState>({
    status: 'offline',
    errorMessage: null,
    providerName: null,
    fileName: null,
  });

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
          setProvider(providerInstance);
          setCurrentFile(cachedFile);
          setSyncStatus({
            status: 'offline',
            errorMessage: null,
            providerName: providerInstance.getName(),
            fileName: cachedFile.name,
          });
          setShowReconnectDialog(true);
          return;
        }

        if (!isAuthenticated && !cachedFile) {
          setShowWelcomeDialog(true);
          return;
        }

        // Set up provider
        setProvider(providerInstance);

        if (!cachedFile) {
          // Authenticated but no file selected yet - show file selection
          setSyncStatus({
            status: 'offline',
            errorMessage: null,
            providerName: providerInstance.getName(),
            fileName: null,
          });
          setShowFileSelection(true);
          return;
        }

        // Happy path: Authenticated and file loaded
        setCurrentFile(cachedFile);
        setSyncStatus({
          status: 'connected',
          errorMessage: null,
          providerName: providerInstance.getName(),
          fileName: cachedFile.name,
        });
      } catch (error) {
        console.error('[SyncProvider] Initialization failed:', error);
        setSyncStatus({
          status: 'error',
          errorMessage: 'Initialization failed',
          providerName: null,
          fileName: null,
        });
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
    if (!provider || !currentFile) {
      return null;
    }
    return new CloudSyncService(provider, currentFile, db);
  }, [provider, currentFile]);

  // Internal function to update file item without clearing DB (for sync updates)
  const updateFileItem = useCallback(
    (fileItem: CloudItem) => {
      setCurrentFile(fileItem);
      try {
        localStorage.setItem(FILE_CACHE_KEY, JSON.stringify(fileItem));
      } catch (error) {
        console.warn('Failed to cache file info:', error);
      }
      setSyncStatus((prev) => ({
        ...prev,
        status: 'connected',
        errorMessage: null,
        fileName: fileItem.name,
      }));
    },
    [setSyncStatus]
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

      // Authenticate (OAuth popup)
      await providerInstance.authenticate();

      // Save provider type to localStorage
      saveProviderConfig(type);

      setProvider(providerInstance);
      setSyncStatus({
        status: 'offline',
        errorMessage: null,
        providerName: providerInstance.getName(),
        fileName: null,
      });
      setShowFileSelection(true);
    },
    [setSyncStatus, setShowFileSelection]
  );

  // Disconnect from storage provider
  const disconnect = useCallback(async (): Promise<void> => {
    clearProviderConfig();
    setProvider(null);
    setCurrentFile(null);
    localStorage.removeItem(FILE_CACHE_KEY);
    setSyncStatus({
      status: 'offline',
      errorMessage: null,
      providerName: null,
      fileName: null,
    });
    setShowWelcomeDialog(true);
  }, [setSyncStatus, setShowWelcomeDialog]);

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

    // Re-authenticate (triggers OAuth popup)
    await providerInstance.authenticate();

    setProvider(providerInstance);

    const cachedFile = loadCachedFile();
    if (!cachedFile) {
      // No file cached → show file picker (stay offline until file selected)
      setSyncStatus((prev) => ({
        ...prev,
        providerName: providerInstance.getName(),
      }));
      setShowFileSelection(true);
    } else {
      // Has file → ready to sync
      setCurrentFile(cachedFile);
      setSyncStatus({
        status: 'connected',
        errorMessage: null,
        providerName: providerInstance.getName(),
        fileName: cachedFile.name,
      });
    }

    // Note: Auto-sync will be triggered by the useEffect watching syncService
  }, [setShowWelcomeDialog, setShowFileSelection, setSyncStatus]);

  // Full bidirectional sync
  const fullSync = useCallback(async (): Promise<void> => {
    if (syncStatus.status === 'offline') {
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
      setSyncStatus((prev) => ({ ...prev, status: 'syncing', errorMessage: null }));

      const result = await syncService.fullSync();
      syncStateRef.current.remoteLastModified = result.mergedLastModified;
      setSyncStatus((prev) => ({ ...prev, status: 'synced', errorMessage: null }));

      if (result.fileItem.id !== currentFile!.id) {
        updateFileItem(result.fileItem);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync with cloud';
      console.error('[SyncProvider] Sync failed:', error, {
        errorMessage,
        timestamp: new Date().toISOString(),
      });

      // Detect authentication/permission errors and transition to offline mode
      if (isAuthenticationError(errorMessage)) {
        setSyncStatus((prev) => ({ ...prev, status: 'offline', errorMessage }));
        showSnackbar(`${errorMessage}. Click sync to reconnect.`, 'info');
      } else {
        setSyncStatus((prev) => ({ ...prev, status: 'error', errorMessage }));
        showSnackbar(errorMessage, 'warning');
      }
    } finally {
      syncStateRef.current.isSyncing = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncService, currentFile, updateFileItem, showSnackbar]);

  // List items in cloud storage
  const listItems = useCallback(
    async (parent?: CloudItem): Promise<CloudItem[]> => {
      if (!provider) {
        throw new Error('Provider not initialized');
      }
      return provider.listItems(parent);
    },
    [provider]
  );

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
    if (!provider || !currentFile || !lastModified || syncStateRef.current.isInitializing) return;

    // Don't trigger debounced sync if we haven't established the remote state yet
    // (initial sync will handle it)
    if (!syncStateRef.current.remoteLastModified) return;

    // Don't sync if already synced to this timestamp
    if (lastModified === syncStateRef.current.remoteLastModified) {
      return;
    }

    setSyncStatus((prev) => {
      // Only update to 'connected' if currently 'synced' (indicates new local changes)
      if (prev.status === 'synced') {
        return { ...prev, status: 'connected' };
      }
      return prev;
    });

    debouncedSync();
  }, [lastModified, provider, currentFile, debouncedSync, setSyncStatus]);

  const value: SyncContextValue = {
    provider,
    currentFile,
    syncStatus,
    selectFile,
    listItems,
    fullSync,
    reconnect,
    connect,
    disconnect,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = (): SyncOperations => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
};
