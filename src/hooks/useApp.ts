import { useState, useCallback } from 'react';
import type { AlertColor } from '@mui/material';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface SyncConnectionState {
  providerName: string | null;
  fileName: string | null;
}

interface SyncStatusState {
  isSyncing: boolean;
  isInitializing: boolean;
  lastSyncError: string | null;
  remoteLastModified: string | null;
}

interface AppState {
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Snackbar
  snackbar: SnackbarState;
  showSnackbar: (message: string, severity?: AlertColor) => void;
  hideSnackbar: () => void;

  // Welcome dialog
  welcomeDismissed: boolean;
  setWelcomeDismissed: (dismissed: boolean) => void;

  // Sync connection state
  syncConnection: SyncConnectionState;
  setSyncConnection: (connection: Partial<SyncConnectionState>) => void;
  isConnected: boolean; // Computed from syncConnection

  // Sync status state
  syncStatus: SyncStatusState;
  setSyncStatus: (status: Partial<SyncStatusState>) => void;
}

// Module-level state (singleton pattern)
let appState: AppState | null = null;
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function getAppState(): AppState {
  if (!appState) {
    let isLoading = false;
    let welcomeDismissed = false;
    let snackbar: SnackbarState = {
      open: false,
      message: '',
      severity: 'info',
    };
    let syncConnection: SyncConnectionState = {
      providerName: null,
      fileName: null,
    };
    let syncStatus: SyncStatusState = {
      isSyncing: false,
      isInitializing: false,
      lastSyncError: null,
      remoteLastModified: null,
    };

    appState = {
      get isLoading() {
        return isLoading;
      },
      setLoading: (loading: boolean) => {
        isLoading = loading;
        notifyListeners();
      },
      get snackbar() {
        return snackbar;
      },
      showSnackbar: (message: string, severity: AlertColor = 'info') => {
        snackbar = { open: true, message, severity };
        notifyListeners();
      },
      hideSnackbar: () => {
        snackbar = { ...snackbar, open: false };
        notifyListeners();
      },
      get welcomeDismissed() {
        return welcomeDismissed;
      },
      setWelcomeDismissed: (dismissed: boolean) => {
        welcomeDismissed = dismissed;
        notifyListeners();
      },
      get syncConnection() {
        return syncConnection;
      },
      setSyncConnection: (connection: Partial<SyncConnectionState>) => {
        syncConnection = { ...syncConnection, ...connection };
        notifyListeners();
      },
      get syncStatus() {
        return syncStatus;
      },
      setSyncStatus: (status: Partial<SyncStatusState>) => {
        syncStatus = { ...syncStatus, ...status };
        notifyListeners();
      },
      get isConnected() {
        return Boolean(syncConnection.providerName && syncConnection.fileName);
      },
    };
  }
  return appState;
}

/**
 * Hook to access and modify app-level state
 * Provides loading state, snackbar controls, and welcome dialog state
 */
export function useApp(): AppState {
  const state = getAppState();
  const [, forceUpdate] = useState(0);

  // Subscribe to state changes
  useState(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  });

  return {
    isLoading: state.isLoading,
    setLoading: useCallback((loading: boolean) => state.setLoading(loading), [state]),
    snackbar: state.snackbar,
    showSnackbar: useCallback(
      (message: string, severity?: AlertColor) => state.showSnackbar(message, severity),
      [state]
    ),
    hideSnackbar: useCallback(() => state.hideSnackbar(), [state]),
    welcomeDismissed: state.welcomeDismissed,
    setWelcomeDismissed: useCallback(
      (dismissed: boolean) => state.setWelcomeDismissed(dismissed),
      [state]
    ),
    syncConnection: state.syncConnection,
    setSyncConnection: useCallback(
      (connection: Partial<SyncConnectionState>) => state.setSyncConnection(connection),
      [state]
    ),
    syncStatus: state.syncStatus,
    setSyncStatus: useCallback(
      (status: Partial<SyncStatusState>) => state.setSyncStatus(status),
      [state]
    ),
    isConnected: state.isConnected,
  };
}

// Export for backwards compatibility
export const useAppContext = useApp;
