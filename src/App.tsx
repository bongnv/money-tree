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
import { ServiceProvider, useArchiveService } from './contexts/ServiceProviders';
import { SyncProvider, useSyncService } from './contexts/SyncProvider';
import { useBaseCurrency } from './hooks/queries';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const syncService = useSyncService();
  const archiveService = useArchiveService();
  const baseCurrency = useBaseCurrency();
  const { snackbar, hideSnackbar, isLoading, welcomeDismissed, setWelcomeDismissed } =
    useAppContext();

  const [showArchivePrompt, setShowArchivePrompt] = useState(false);
  const [archiveYearSummary, setArchiveYearSummary] = useState<any>(null);
  const [archiveYear, setArchiveYear] = useState<number | null>(null);

  // Handle initial sync completion
  useEffect(() => {
    // Wait for SyncProvider to finish initializing
    if (syncService.isInitializing) return;

    // Connected and synced, check for archive prompt
    if (syncService.isConnected) {
      checkArchivePrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncService.isInitializing, syncService.isConnected]);

  const handleWelcomeClose = () => {
    setWelcomeDismissed(true);
  };

  const checkArchivePrompt = async () => {
    const archivableYear = await archiveService.identifyArchivableYear();
    if (archivableYear !== null) {
      const summary = archiveService.calculateYearEndSummary(archivableYear, baseCurrency);
      setArchiveYear(archivableYear);
      setArchiveYearSummary(summary);
      setShowArchivePrompt(true);
    }
  };

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
      <WelcomeDialog
        open={!syncService.isInitializing && !syncService.isConnected && !welcomeDismissed}
        onClose={handleWelcomeClose}
      />
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
        <BrowserRouter>
          <SyncProvider onReconnectNeeded={handleReconnectNeeded}>
            <ServiceProvider>
              <AppContent />
            </ServiceProvider>
          </SyncProvider>
        </BrowserRouter>
        <ReconnectDialog
          open={reconnectDialogState.open}
          providerName={reconnectDialogState.providerName}
          onReconnect={handleReconnect}
          onDismiss={handleReconnectDismiss}
        />
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
