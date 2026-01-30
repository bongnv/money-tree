import { useCallback, useEffect, useMemo, useRef } from 'react';
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
  setFile: (fileItem: CloudItem) => void;
  listItems: (parent?: CloudItem) => Promise<CloudItem[]>;

  // Sync methods
  fullSync: () => Promise<void>;

  // Connection methods
  connect: (type: StorageProviderType) => Promise<void>;
  disconnect: () => Promise<void>;
}

// Singleton internal state (not UI state)
let internalState: {
  provider: IStorageProvider | null;
  currentFileItem: CloudItem | null;
  onReconnectNeeded: ((providerName: string) => Promise<'reconnect' | 'dismiss'>) | null;
} = {
  provider: null,
  currentFileItem: null,
  onReconnectNeeded: null,
};

const DEBOUNCE_MS = 30000; // 30 seconds for all syncs

let isInitialized = false;

/**
 * Hook to access sync operations
 * State is managed in useApp(), this hook provides operations only
 */
export function useSync(
  onReconnectNeeded?: (providerName: string) => Promise<'reconnect' | 'dismiss'>
): SyncOperations {
  const { showSnackbar, setSyncConnection, setSyncStatus, syncStatus, isConnected } = useApp();

  // Store reconnect callback
  useEffect(() => {
    if (onReconnectNeeded) {
      internalState.onReconnectNeeded = onReconnectNeeded;
    }
  }, [onReconnectNeeded]);

  // Initialize storage provider on first mount
  useEffect(() => {
    if (isInitialized) return;
    isInitialized = true;

    const initialize = async () => {
      setSyncStatus({ isInitializing: true });

      const result = await StorageProviderFactory.initialize(
        internalState.onReconnectNeeded || (() => Promise.resolve('dismiss' as const))
      );

      if (result) {
        internalState.provider = result;
        setSyncConnection({ providerName: result.getName() });

        // Load cached file info
        try {
          const cached = localStorage.getItem(FILE_CACHE_KEY);
          if (cached) {
            const fileItem = JSON.parse(cached) as CloudItem;
            internalState.currentFileItem = fileItem;
            setSyncConnection({
              fileName: fileItem.name,
            });
          }
        } catch (error) {
          console.warn('Failed to load cached file info:', error);
        }
      }

      setSyncStatus({ isInitializing: false });
    };

    initialize();
  }, [setSyncConnection, setSyncStatus]);

  // Watch lastModified timestamp for changes
  const lastModified = useLiveQuery(() =>
    db.syncMetadata.get('lastModified').then((r) => r?.value as string | null)
  );

  // Create sync service
  const syncService = useMemo(() => {
    if (!internalState.provider || !internalState.currentFileItem) return null;
    const syncMetadataService = new SyncMetadataService(db);
    return new CloudSyncService(
      internalState.provider,
      internalState.currentFileItem,
      db,
      syncMetadataService
    );
  }, [internalState.provider, internalState.currentFileItem]);

  // Set current file and cache to localStorage
  const setFile = useCallback(
    (fileItem: CloudItem) => {
      internalState.currentFileItem = fileItem;
      try {
        localStorage.setItem(FILE_CACHE_KEY, JSON.stringify(fileItem));
      } catch (error) {
        console.warn('Failed to cache file info:', error);
      }
      setSyncConnection({
        fileName: fileItem.name,
        providerName: internalState.provider?.getName() ?? null,
      });
    },
    [setSyncConnection]
  );

  // Connect to a storage provider
  const connect = useCallback(
    async (type: StorageProviderType): Promise<void> => {
      const result = await StorageProviderFactory.connect({ type });
      internalState.provider = result;
      setSyncConnection({ providerName: result.getName() });
    },
    [setSyncConnection]
  );

  // Disconnect from storage provider
  const disconnect = useCallback(async (): Promise<void> => {
    await StorageProviderFactory.disconnect(internalState.provider);
    internalState.provider = null;
    internalState.currentFileItem = null;
    localStorage.removeItem(FILE_CACHE_KEY);
    setSyncConnection({
      providerName: null,
      fileName: null,
    });
  }, [setSyncConnection]);

  // Full bidirectional sync
  const fullSync = useCallback(async (): Promise<void> => {
    if (!syncService) {
      throw new Error('Sync service not initialized or no file selected');
    }
    if (syncStatus.isSyncing) return; // Prevent concurrent syncs

    try {
      setSyncStatus({ isSyncing: true, lastSyncError: null });

      const result = await syncService.fullSync();
      setSyncStatus({ remoteLastModified: result.mergedLastModified });

      // Update file item if it changed (new file got ID)
      if (result.fileItem.id !== internalState.currentFileItem!.id) {
        setFile(result.fileItem);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync with cloud';
      setSyncStatus({ lastSyncError: errorMessage });
      console.error('Sync failed:', error);
      showSnackbar(errorMessage, 'warning');
      throw error;
    } finally {
      setSyncStatus({ isSyncing: false });
    }
  }, [syncService, setFile, showSnackbar, setSyncStatus, syncStatus.isSyncing]);

  // List items in cloud storage
  const listItems = useCallback(
    async (parent?: CloudItem): Promise<CloudItem[]> => {
      if (!internalState.provider) {
        throw new Error('Provider not initialized');
      }
      return internalState.provider.listItems(parent);
    },
    [internalState.provider]
  );

  // Debounced sync using useDebouncedCallback
  const debouncedSync = useDebouncedCallback(
    async () => {
      if (!syncService) return;
      try {
        await fullSync();
      } catch {
        // Error already logged and shown by fullSync
      }
    },
    DEBOUNCE_MS,
    { leading: false, trailing: true }
  );

  // Auto-sync when connection established
  const hasTriggeredInitialSync = useRef(false);
  useEffect(() => {
    if (!isConnected || syncStatus.isSyncing || syncStatus.isInitializing) return;
    if (hasTriggeredInitialSync.current) return;
    hasTriggeredInitialSync.current = true;
    fullSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Auto-sync whenever lastModified changes
  useEffect(() => {
    if (!isConnected || !lastModified || syncStatus.isInitializing) return;
    // Skip if local and remote are already in sync
    if (lastModified === syncStatus.remoteLastModified) return;
    debouncedSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastModified]);

  return {
    setFile,
    listItems,
    fullSync,
    connect,
    disconnect,
  };
}
