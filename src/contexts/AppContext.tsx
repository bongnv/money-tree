import React, { createContext, useContext, useCallback, useState } from 'react';
import type { AlertColor } from '@mui/material';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface AppContextValue {
  // Snackbar
  snackbar: SnackbarState;
  showSnackbar: (message: string, severity?: AlertColor) => void;
  hideSnackbar: () => void;

  // Dialog visibility
  showWelcomeDialog: boolean;
  setShowWelcomeDialog: (show: boolean) => void;
  showFileSelection: boolean;
  setShowFileSelection: (show: boolean) => void;
  showReconnectDialog: boolean;
  setShowReconnectDialog: (show: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showFileSelection, setShowFileSelection] = useState(false);
  const [showReconnectDialog, setShowReconnectDialog] = useState(false);

  const showSnackbarCallback = useCallback((message: string, severity: AlertColor = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const value: AppContextValue = {
    snackbar,
    showSnackbar: showSnackbarCallback,
    hideSnackbar,
    showWelcomeDialog,
    setShowWelcomeDialog,
    showFileSelection,
    setShowFileSelection,
    showReconnectDialog,
    setShowReconnectDialog,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Export for backwards compatibility
export const useAppContext = useApp;
