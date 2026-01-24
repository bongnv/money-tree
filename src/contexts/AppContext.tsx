import { createContext, useContext, useState, ReactNode } from 'react';
import type { AlertColor } from '@mui/material';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface AppContextValue {
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;

  // Snackbar
  snackbar: SnackbarState;
  showSnackbar: (message: string, severity?: AlertColor) => void;
  hideSnackbar: () => void;

  // Welcome dialog
  shouldShowWelcome: boolean;
  setShouldShowWelcome: (show: boolean) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showSnackbar = (message: string, severity: AlertColor = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const value: AppContextValue = {
    isLoading,
    setLoading,
    isSyncing,
    setIsSyncing,
    snackbar,
    showSnackbar,
    hideSnackbar,
    shouldShowWelcome,
    setShouldShowWelcome,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
