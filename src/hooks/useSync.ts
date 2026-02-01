import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDebouncedCallback } from 'use-debounce';
import { CloudSyncService } from '@/services/cloudSync.service';
import { SyncMetadataService } from '@/services/syncMetadata.service';
import { StorageProviderFactory } from '@/services/storage/StorageProviderFactory';
import { IStorageProvider, CloudItem } from '@/services/storage/IStorageProvider';
import type { StorageProviderType } from '@/services/storage/StorageProviderFactory';
import { useApp } from './useApp';
import { db } from '@/db/database';

const FILE_CACHE_KEY = 'moneyTree.currentFile';

export interface SyncOperations {
  // File management
  selectFile: (fileItem: CloudItem) => Promise<void>;
  listItems: (parent?: CloudItem) => Promise<CloudItem[]>;

  // Sync methods
  fullSync: () => Promise<void>;

  // Connection methods
  connect: (type: StorageProviderType) => Promise<void>;
  disconnect: () => Promise<void>;
}

// Singleton internal state (not UI state)
let provider: IStorageProvider | null = null;
let currentFileItem: CloudItem | null = null;
let onReconnectNeeded: ((providerName: string) => Promise<'reconnect' | 'dismiss'>) | null = null;

const DEBOUNCE_MS = 30000; // 30 seconds for all syncs

// Internal sync state (separate from app UI state for timing accuracy)
const syncState = {
  isInitialized: false,
  isSyncing: false,
  isInitializing: false,
  remoteLastModified: null as string | null,
};

/**
 * Hook to access sync operations
 * State is managed in useApp(), this hook provides operations only
 */
export function useSync(
  onReconnectNeededCallback?: (providerName: string) => Promise<'reconnect' | 'dismiss'>
): SyncOperations {
  const { showSnackbar, setSyncStatus, setShowWelcomeDialog, setShowFileSelection } = useApp();
  // React state to track module-level variables for proper dependency tracking
  const [providerState, setProviderState] = useState<IStorageProvider | null>(provider);
  const [fileState, setFileState] = useState<CloudItem | null>(currentFileItem);

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
        // Reset any stuck sync state from previous session
        syncState.isSyncing = false;
        syncState.isInitializing = true;
        setSyncStatus({ status: 'not-connected' });

        const result = await StorageProviderFactory.initialize(
          onReconnectNeeded || (() => Promise.resolve('dismiss' as const))
        );

        if (result) {
          provider = result;
          setProviderState(result);

          // Load cached file info
          let fileName: string | null = null;
          try {
            const cached = localStorage.getItem(FILE_CACHE_KEY);
            if (cached) {
              const fileItem = JSON.parse(cached) as CloudItem;
              currentFileItem = fileItem;
              setFileState(fileItem);
              fileName = fileItem.name;

              // Load last synced timestamp from database
              const lastSyncedRecord = await db.syncMetadata.get('lastModified');
              if (lastSyncedRecord?.value) {
                syncState.remoteLastModified = lastSyncedRecord.value as string;
              }
            }
          } catch (error) {
            console.warn('Failed to load cached file info:', error);
          }

          // Update sync status with connection info
          if (fileName) {
            setSyncStatus({
              status: 'connected',
              providerName: result.getName(),
              fileName: fileName,
            });
          } else {
            setSyncStatus({
              status: 'not-connected',
              providerName: result.getName(),
              fileName: null,
            });
            // Provider exists but no file - show file selection
            setShowFileSelection(true);
          }
        }

        // Show welcome dialog if no provider after initialization
        if (!provider) {
          setShowWelcomeDialog(true);
        }
      } catch (error) {
        console.error('[useSync] Initialization failed:', error);
        setSyncStatus({ status: 'error', errorMessage: 'Initialization failed' });
        // Show welcome dialog on initialization failure
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
    if (!providerState || !fileState) return null;
    const syncMetadataService = new SyncMetadataService(db);
    return new CloudSyncService(providerState, fileState, db, syncMetadataService);
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
        fileName: fileItem.name,
        providerName: provider?.getName() ?? null,
      });
    },
    [setSyncStatus]
  );

  // Select file for syncing (clears DB for fresh start)
  const selectFile = useCallback(
    async (fileItem: CloudItem) => {
      // Clear Dexie database for fresh start with new file
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
        providerName: result.getName(),
        fileName: null,
      });
      // After successful authentication, show file picker
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
      providerName: null,
      fileName: null,
    });
    // Show welcome dialog after disconnection
    setShowWelcomeDialog(true);
  }, [setSyncStatus, setShowWelcomeDialog]);

  // Full bidirectional sync
  const fullSync = useCallback(async (): Promise<void> => {
    if (!syncService) {
      throw new Error('Sync service not initialized or no file selected');
    }
    if (syncState.isSyncing) {
      return; // Prevent concurrent syncs
    }

    try {
      syncState.isSyncing = true;
      setSyncStatus({ status: 'syncing', errorMessage: null });

      const result = await syncService.fullSync();
      // Update internal state remoteLastModified
      syncState.remoteLastModified = result.mergedLastModified;
      setSyncStatus({ status: 'synced' });

      // Update file item if it changed (new file got ID)
      if (result.fileItem.id !== currentFileItem!.id) {
        updateFileItem(result.fileItem);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync with cloud';
      console.error('[useSync] Sync failed:', error, {
        errorMessage,
        timestamp: new Date().toISOString(),
      });
      setSyncStatus({ status: 'error', errorMessage });
      showSnackbar(errorMessage, 'warning');
      // Don't rethrow - error already logged, shown to user, and stored in state
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
      console.error('[useSync] Initial sync error:', err);
    });
  }, [syncService, fullSync]);

  // Auto-sync whenever lastModified changes
  useEffect(() => {
    const isConnected = !!(provider && currentFileItem);
    if (!isConnected || !lastModified || syncState.isInitializing) return;
    // Skip if local and remote are already in sync
    if (lastModified === syncState.remoteLastModified) {
      return;
    }

    debouncedSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastModified]);

  return {
    selectFile,
    listItems,
    fullSync,
    connect,
    disconnect,
  };
}
