import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDebouncedCallback } from 'use-debounce';
import { CloudSyncService } from '@/services/cloudSync.service';
import { StorageProviderFactory } from '@/services/storage/StorageProviderFactory';
import { IStorageProvider, CloudItem } from '@/services/storage/IStorageProvider';
import type { StorageProviderType } from '@/services/storage/StorageProviderFactory';
import { useApp } from '@/contexts/AppContext';
import { db } from '@/db/database';

const FILE_CACHE_KEY = 'moneyTree.currentFile';

// Simplified sync status for UI display
export type SyncUIStatus =
  | 'not-connected' // No provider or file configured
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

  // Connection methods
  connect: (type: StorageProviderType) => Promise<void>;
  disconnect: () => Promise<void>;

  // Status
  syncStatus: SyncStatusState;
}

interface SyncContextValue extends SyncOperations {
  provider: IStorageProvider | null;
  currentFile: CloudItem | null;
}

const SyncContext = createContext<SyncContextValue | null>(null);

const DEBOUNCE_MS = 30000; // 30 seconds for all syncs

// Singleton internal state (not UI state)
let provider: IStorageProvider | null = null;
let currentFileItem: CloudItem | null = null;
let onReconnectNeeded: ((providerName: string) => Promise<'reconnect' | 'dismiss'>) | null = null;

// Internal sync state (separate from app UI state for timing accuracy)
const syncState = {
  isInitialized: false,
  isSyncing: false,
  isInitializing: false,
  remoteLastModified: null as string | null,
};

interface SyncProviderProps {
  children: React.ReactNode;
  onReconnectNeeded?: (providerName: string) => Promise<'reconnect' | 'dismiss'>;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({
  children,
  onReconnectNeeded: onReconnectNeededCallback,
}) => {
  const { showSnackbar, setShowWelcomeDialog, setShowFileSelection } = useApp();
  const [providerState, setProviderState] = useState<IStorageProvider | null>(provider);
  const [fileState, setFileState] = useState<CloudItem | null>(currentFileItem);
  const [syncStatus, setSyncStatus] = useState<SyncStatusState>({
    status: 'not-connected',
    errorMessage: null,
    providerName: null,
    fileName: null,
  });

  // Store reconnect callback
  useEffect(() => {
    if (onReconnectNeededCallback) {
      onReconnectNeeded = onReconnectNeededCallback;
    }
  }, [onReconnectNeededCallback]);

  // Initialize storage provider on first mount
  useEffect(() => {
    if (syncState.isInitialized) return;
    syncState.isInitialized = true;

    const initialize = async () => {
      try {
        syncState.isSyncing = false;
        syncState.isInitializing = true;

        const result = await StorageProviderFactory.initialize(
          onReconnectNeeded || (() => Promise.resolve('dismiss' as const))
        );

        if (result) {
          provider = result;
          setProviderState(result);

          let fileName: string | null = null;
          try {
            const cached = localStorage.getItem(FILE_CACHE_KEY);
            if (cached) {
              const fileItem = JSON.parse(cached) as CloudItem;
              currentFileItem = fileItem;
              setFileState(fileItem);
              fileName = fileItem.name;
            }
          } catch (error) {
            console.warn('Failed to load cached file info:', error);
          }

          if (fileName) {
            setSyncStatus({
              status: 'connected',
              errorMessage: null,
              providerName: result.getName(),
              fileName: fileName,
            });
          } else {
            setSyncStatus({
              status: 'not-connected',
              errorMessage: null,
              providerName: result.getName(),
              fileName: null,
            });
            setShowFileSelection(true);
          }
        }

        if (!provider) {
          setShowWelcomeDialog(true);
        }
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
        syncState.isInitializing = false;
      }
    };

    initialize();
  }, [setSyncStatus, setShowFileSelection, setShowWelcomeDialog]);

  // Watch lastModified timestamp for changes
  const lastModified = useLiveQuery(() =>
    db.syncMetadata.get('lastModified').then((r) => r?.value as string | null)
  );

  // Create sync service
  const syncService = useMemo(() => {
    if (!providerState || !fileState) {
      return null;
    }
    return new CloudSyncService(providerState, fileState, db);
  }, [providerState, fileState]);

  // Internal function to update file item without clearing DB (for sync updates)
  const updateFileItem = useCallback(
    (fileItem: CloudItem) => {
      currentFileItem = fileItem;
      setFileState(fileItem);
      try {
        localStorage.setItem(FILE_CACHE_KEY, JSON.stringify(fileItem));
      } catch (error) {
        console.warn('Failed to cache file info:', error);
      }
      setSyncStatus({
        status: 'connected',
        errorMessage: null,
        fileName: fileItem.name,
        providerName: provider?.getName() ?? null,
      });
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
      const result = await StorageProviderFactory.connect({ type });
      provider = result;
      setProviderState(result);
      setSyncStatus({
        status: 'not-connected',
        errorMessage: null,
        providerName: result.getName(),
        fileName: null,
      });
      setShowFileSelection(true);
    },
    [setSyncStatus, setShowFileSelection]
  );

  // Disconnect from storage provider
  const disconnect = useCallback(async (): Promise<void> => {
    await StorageProviderFactory.disconnect(provider);
    provider = null;
    currentFileItem = null;
    setProviderState(null);
    setFileState(null);
    localStorage.removeItem(FILE_CACHE_KEY);
    setSyncStatus({
      status: 'not-connected',
      errorMessage: null,
      providerName: null,
      fileName: null,
    });
    setShowWelcomeDialog(true);
  }, [setSyncStatus, setShowWelcomeDialog]);

  // Full bidirectional sync
  const fullSync = useCallback(async (): Promise<void> => {
    if (!syncService) {
      throw new Error('Sync service not initialized or no file selected');
    }
    if (syncState.isSyncing) {
      return;
    }

    try {
      syncState.isSyncing = true;
      setSyncStatus((prev) => ({ ...prev, status: 'syncing', errorMessage: null }));

      const result = await syncService.fullSync();
      syncState.remoteLastModified = result.mergedLastModified;
      setSyncStatus((prev) => ({ ...prev, status: 'synced', errorMessage: null }));

      if (result.fileItem.id !== currentFileItem!.id) {
        updateFileItem(result.fileItem);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync with cloud';
      console.error('[SyncProvider] Sync failed:', error, {
        errorMessage,
        timestamp: new Date().toISOString(),
      });
      setSyncStatus((prev) => ({ ...prev, status: 'error', errorMessage }));
      showSnackbar(errorMessage, 'warning');
    } finally {
      syncState.isSyncing = false;
    }
  }, [syncService, updateFileItem, showSnackbar, setSyncStatus]);

  // List items in cloud storage
  const listItems = useCallback(async (parent?: CloudItem): Promise<CloudItem[]> => {
    if (!provider) {
      throw new Error('Provider not initialized');
    }
    return provider.listItems(parent);
  }, []);

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

  // Auto-sync whenever lastModified changes
  useEffect(() => {
    const isConnected = !!(provider && currentFileItem);
    if (!isConnected || !lastModified || syncState.isInitializing) return;
    if (lastModified === syncState.remoteLastModified) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastModified]);

  const value: SyncContextValue = {
    provider: providerState,
    currentFile: fileState,
    syncStatus,
    selectFile,
    listItems,
    fullSync,
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
