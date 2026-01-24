import React, { useEffect, useState } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Backdrop, CircularProgress } from '@mui/material';
import theme from './theme';
import { MainLayout } from './components/layout/MainLayout';
import { WelcomeDialog } from './components/onboarding/WelcomeDialog';
import { NotificationSnackbar } from './components/common/NotificationSnackbar';
import ReconnectDialog from './components/common/ReconnectDialog';
import { ArchivePrompt } from './components/common/ArchivePrompt';
import { AppRoutes } from './routes';
import { AppProvider, useAppContext } from './contexts/AppContext';
import {
  ServiceProvider,
  useStorageFactory,
  useArchiveService,
} from './contexts/ServiceProviders';
import { initCloudSyncService, getCloudSyncService } from './services/cloudSync.service';
import { useBaseCurrency } from './hooks/queries';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const storageFactory = useStorageFactory();
  const archiveService = useArchiveService();
  const baseCurrency = useBaseCurrency();
  const {
    snackbar,
    hideSnackbar,
    isLoading,
    shouldShowWelcome,
    setShouldShowWelcome,
    setLoading,
    showSnackbar,
    setIsSyncing,
  } = useAppContext();
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  // Watch shouldShowWelcome from context
  useEffect(() => {
    if (shouldShowWelcome) {
      setShowWelcomeDialog(true);
      setShouldShowWelcome(false); // Reset flag after showing
    }
  }, [shouldShowWelcome, setShouldShowWelcome]);

  const [showArchivePrompt, setShowArchivePrompt] = useState(false);
  const [archiveYearSummary, setArchiveYearSummary] = useState<any>(null);
  const [archiveYear, setArchiveYear] = useState<number | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize storage provider
        const success = await storageFactory.initialize();

        if (!success) {
          // No cached connection or user dismissed - show welcome dialog
          setShowWelcomeDialog(true);
          return;
        }

        // Initialize cloud sync service with callbacks
        const cloudSync = initCloudSyncService(storageFactory, {
          onSyncStart: () => setIsSyncing(true),
          onSyncComplete: () => {
            setIsSyncing(false);
          },
          onSyncError: (error) => {
            setIsSyncing(false);
            console.error('Sync error:', error);
          },
        });

        // Try to sync from cloud (this will populate Dexie if empty)
        setLoading(true);
        try {
          await cloudSync.downloadFromCloud();
          showSnackbar('Data synced successfully', 'success');
          checkArchivePrompt();
        } catch (error) {
          console.error('Failed to sync:', error);
          const message = error instanceof Error ? error.message : 'Failed to sync with cloud';
          showSnackbar(message, 'warning');
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error('App initialization error:', error);
        showSnackbar('Failed to initialize app', 'error');
      }
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const checkArchivePrompt = () => {
    const archivableYear = archiveService.identifyArchivableYear();
    if (archivableYear !== null) {
      const summary = archiveService.calculateYearEndSummary(archivableYear, baseCurrency);
      setArchiveYear(archivableYear);
      setArchiveYearSummary(summary);
      setShowArchivePrompt(true);
    }
  };

  // Auto-reload data when tab becomes visible (with 30-minute throttle)
  useEffect(() => {
    let lastReloadTime = 0;
    const RELOAD_THROTTLE_MS = 30 * 60 * 1000; // 30 minutes

    const handleVisibilityChange = async () => {
      // Only reload if tab is visible
      if (document.hidden) {
        return;
      }

      const now = Date.now();
      if (now - lastReloadTime < RELOAD_THROTTLE_MS) {
        // Too soon since last reload, skip
        return;
      }

      lastReloadTime = now;

      try {
        const cloudSync = getCloudSyncService();
        await cloudSync.downloadFromCloud();
      } catch (error) {
        console.error('Failed to reload data:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Register once on mount

  const handleArchiveGoToSettings = () => {
    setShowArchivePrompt(false);
    // Navigate to archive settings page using React Router
    navigate('/settings/archives');
  };

  return (
    <>
      <MainLayout>
        <AppRoutes />
      </MainLayout>
      <WelcomeDialog open={showWelcomeDialog} onClose={() => setShowWelcomeDialog(false)} />
      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={hideSnackbar}
      />
      {archiveYearSummary && archiveYear && (
        <ArchivePrompt
          open={showArchivePrompt}
          year={archiveYear}
          yearSummary={archiveYearSummary}
          baseCurrency={baseCurrency}
          onGoToSettings={handleArchiveGoToSettings}
          onRemindLater={() => setShowArchivePrompt(false)}
        />
      )}
      <Backdrop open={isLoading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};

const App: React.FC = () => {
  const [reconnectDialogState, setReconnectDialogState] = useState<{
    open: boolean;
    providerName: string;
    resolve: ((value: 'reconnect' | 'dismiss') => void) | null;
  }>({
    open: false,
    providerName: '',
    resolve: null,
  });

  // Reconnect callback to be injected into StorageService
  const handleReconnectNeeded = async (providerName: string): Promise<'reconnect' | 'dismiss'> => {
    return new Promise<'reconnect' | 'dismiss'>((resolve) => {
      setReconnectDialogState({
        open: true,
        providerName,
        resolve,
      });
    });
  };

  const handleReconnect = () => {
    if (reconnectDialogState.resolve) {
      reconnectDialogState.resolve('reconnect');
    }
    setReconnectDialogState({ open: false, providerName: '', resolve: null });
  };

  const handleReconnectDismiss = () => {
    if (reconnectDialogState.resolve) {
      reconnectDialogState.resolve('dismiss');
    }
    setReconnectDialogState({ open: false, providerName: '', resolve: null });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <ServiceProvider onReconnectNeeded={handleReconnectNeeded}>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
          <ReconnectDialog
            open={reconnectDialogState.open}
            providerName={reconnectDialogState.providerName}
            onReconnect={handleReconnect}
            onDismiss={handleReconnectDismiss}
          />
        </ServiceProvider>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
