import { useState, useCallback } from 'react';
import type { AlertColor } from '@mui/material';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
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
  };
}

// Export for backwards compatibility
export const useAppContext = useApp;
