import { useState, useCallback } from 'react';
import type { AlertColor } from '@mui/material';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

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

interface AppState {
  // Snackbar
  snackbar: SnackbarState;
  showSnackbar: (message: string, severity?: AlertColor) => void;
  hideSnackbar: () => void;

  // Dialog visibility
  showWelcomeDialog: boolean;
  setShowWelcomeDialog: (show: boolean) => void;
  showFileSelection: boolean;
  setShowFileSelection: (show: boolean) => void;

  // Sync status for UI
  syncStatus: SyncStatusState;
  setSyncStatus: (status: Partial<SyncStatusState>) => void;

  // Computed convenience properties
  isConnected: boolean;
}

// Module-level state (singleton pattern)
let appState: AppState | null = null;
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function getAppState(): AppState {
  if (!appState) {
    let showWelcomeDialog = false;
    let showFileSelection = false;
    let snackbar: SnackbarState = {
      open: false,
      message: '',
      severity: 'info',
    };
    let syncStatus: SyncStatusState = {
      status: 'not-connected',
      errorMessage: null,
      providerName: null,
      fileName: null,
    };

    appState = {
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
      get showWelcomeDialog() {
        return showWelcomeDialog;
      },
      setShowWelcomeDialog: (show: boolean) => {
        showWelcomeDialog = show;
        notifyListeners();
      },
      get showFileSelection() {
        return showFileSelection;
      },
      setShowFileSelection: (show: boolean) => {
        showFileSelection = show;
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
        return syncStatus.status !== 'not-connected';
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
    snackbar: state.snackbar,
    showSnackbar: useCallback(
      (message: string, severity?: AlertColor) => state.showSnackbar(message, severity),
      [state]
    ),
    hideSnackbar: useCallback(() => state.hideSnackbar(), [state]),
    showWelcomeDialog: state.showWelcomeDialog,
    setShowWelcomeDialog: useCallback((show: boolean) => state.setShowWelcomeDialog(show), [state]),
    showFileSelection: state.showFileSelection,
    setShowFileSelection: useCallback((show: boolean) => state.setShowFileSelection(show), [state]),
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
