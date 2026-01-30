import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CloudSyncService } from '../services/cloudSync.service';
import { SyncMetadataService } from '../services/syncMetadata.service';
import { StorageProviderFactory } from '../services/storage/StorageProviderFactory';
import { IStorageProvider, CloudItem } from '../services/storage/IStorageProvider';
import type { StorageProviderType } from '../services/storage/StorageProviderFactory';
import { useAppContext } from './AppContext';
import { db } from '../db/database';

const FILE_CACHE_KEY = 'moneyTree.currentFile';

export interface SyncContextValue {
  // Connection state
  isConnected: boolean;
  providerName: string | null;
  fileName: string | null;

  // Sync state
  isInitializing: boolean;
  isSyncing: boolean;
  remoteLastModified: string | null;
  lastSyncError: string | null;

  // File management
  setFile: (fileItem: CloudItem) => void;
  listItems: (parent?: CloudItem) => Promise<CloudItem[]>;

  // Sync methods
  fullSync: () => Promise<void>;
  // debouncedSync removed - internal only, auto-triggered by lastModified changes

  // Connection methods
  connect: (type: StorageProviderType) => Promise<void>;
  disconnect: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
  onReconnectNeeded: (providerName: string) => Promise<'reconnect' | 'dismiss'>;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children, onReconnectNeeded }) => {
  const { showSnackbar } = useAppContext();

  // Provider and services
  const [provider, setProvider] = useState<IStorageProvider | null>(null);
  const [currentFileItem, setCurrentFileItem] = useState<CloudItem | null>(null);

  // Connection state (derived from provider)
  const [isInitializing, setIsInitializing] = useState(true);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [remoteLastModified, setRemoteLastModified] = useState<string | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  // Debounce timers (use refs to avoid recreating callbacks)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isConnected = Boolean(provider && currentFileItem);

  // Constants
  const DEBOUNCE_MS = 30000; // 30 seconds for all syncs
  const BACKGROUND_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  // Memoize CloudSyncService to avoid creating it on every sync
  const syncService = useMemo(() => {
    if (!provider || !currentFileItem) return null;
    const syncMetadataService = new SyncMetadataService(db);
    return new CloudSyncService(provider, currentFileItem, db, syncMetadataService);
  }, [provider, currentFileItem]);

  // Set current file and cache to localStorage
  const setFile = useCallback((fileItem: CloudItem) => {
    setCurrentFileItem(fileItem);
    try {
      localStorage.setItem(FILE_CACHE_KEY, JSON.stringify(fileItem));
    } catch (error) {
      console.warn('Failed to cache file info:', error);
    }
  }, []);

  // Initialize storage provider using static factory
  const initialize = useCallback(async (): Promise<boolean> => {
    const result = await StorageProviderFactory.initialize(onReconnectNeeded);
    if (result) {
      setProvider(result);

      // Load cached file info
      try {
        const cached = localStorage.getItem(FILE_CACHE_KEY);
        if (cached) {
          const fileItem = JSON.parse(cached) as CloudItem;
          setCurrentFileItem(fileItem);
          return true;
        }
      } catch (error) {
        console.warn('Failed to load cached file info:', error);
      }
      return false;
    }
    return false;
  }, [onReconnectNeeded]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      await initialize();
      setIsInitializing(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Watch lastModified timestamp for changes
  const lastModified = useLiveQuery(() =>
    db.syncMetadata.get('lastModified').then((r) => r?.value as string | null)
  );

  // Auto-sync whenever we have a connected file (handles both initial load and file changes)
  useEffect(() => {
    if (!isConnected || isSyncing || isInitializing) return;
    fullSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]); // Trigger when connection state changes (provider + file both available)

  // Auto-sync whenever lastModified changes (triggered by any data write)
  useEffect(() => {
    if (!isConnected || !lastModified || isInitializing) return;
    debouncedSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastModified]); // Trigger when data changes

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (backgroundSyncIntervalRef.current) clearInterval(backgroundSyncIntervalRef.current);
    };
  }, []);

  // Connect to a storage provider using static factory
  const connect = useCallback(async (type: StorageProviderType): Promise<void> => {
    const result = await StorageProviderFactory.connect({ type });
    setProvider(result);
  }, []);

  // Disconnect from storage provider
  const disconnect = useCallback(async (): Promise<void> => {
    await StorageProviderFactory.disconnect(provider);
    setProvider(null);
    setCurrentFileItem(null);
    localStorage.removeItem(FILE_CACHE_KEY);
  }, [provider]);

  // Full bidirectional sync
  const fullSync = useCallback(async (): Promise<void> => {
    if (!syncService) {
      throw new Error('Sync service not initialized or no file selected');
    }
    if (isSyncing) return; // Prevent concurrent syncs

    try {
      setIsSyncing(true);
      setLastSyncError(null);
      const result = await syncService.fullSync();
      setRemoteLastModified(result.mergedLastModified);
      // Update file item if it changed (new file got ID)
      if (result.fileItem.id !== currentFileItem!.id) {
        setFile(result.fileItem);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync with cloud';
      setLastSyncError(errorMessage);
      console.error('Sync failed:', error);
      showSnackbar(errorMessage, 'warning');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [syncService, currentFileItem, isSyncing, setFile, showSnackbar]);

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

  // Debounced sync (delays execution after last change, uses fullSync for safety)
  const debouncedSync = useCallback((): void => {
    if (!syncService) {
      // Service not initialized yet, skip
      return;
    }

    // Clear existing timer if any
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new debounce timer
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        await fullSync();
      } catch {
        // Error already logged and shown by fullSync
      } finally {
        debounceTimeoutRef.current = null;
      }
    }, DEBOUNCE_MS);
  }, [syncService, DEBOUNCE_MS, fullSync]);

  // Set up background sync (5 minutes interval) - uses shared debounced sync
  useEffect(() => {
    if (!isConnected) return;

    // Set up interval to trigger debounced sync periodically
    backgroundSyncIntervalRef.current = setInterval(() => {
      debouncedSync();
    }, BACKGROUND_SYNC_INTERVAL_MS);

    return () => {
      if (backgroundSyncIntervalRef.current) {
        clearInterval(backgroundSyncIntervalRef.current);
        backgroundSyncIntervalRef.current = null;
      }
    };
  }, [isConnected, BACKGROUND_SYNC_INTERVAL_MS, debouncedSync]);

  const value: SyncContextValue = {
    // Connection state (derived from provider and currentFileItem)
    isConnected,
    providerName: provider?.getName() ?? null,
    fileName: currentFileItem?.name ?? null,

    // Sync state
    isInitializing,
    isSyncing,
    remoteLastModified,
    lastSyncError,

    // File management
    setFile,
    listItems,

    // Sync methods
    fullSync,
    // debouncedSync removed - internal only, auto-triggered by lastModified changes

    // Connection methods
    connect,
    disconnect,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

/**
 * Hook to access sync service from context
 */
export function useSyncService(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncService must be used within SyncProvider');
  }
  return context;
}
