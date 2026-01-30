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
import { useBaseCurrency } from '@hooks/useSyncMetadata';
import { useArchiveService } from '@/hooks/useServices';
import { useApp } from '@/hooks/useApp';
import { useSync } from '@/hooks/useSync';

const AppContent: React.FC<{
  onReconnectNeeded: (providerName: string) => Promise<'reconnect' | 'dismiss'>;
}> = ({ onReconnectNeeded }) => {
  const navigate = useNavigate();
  useSync(onReconnectNeeded);
  const archiveService = useArchiveService();
  const baseCurrency = useBaseCurrency();
  const {
    snackbar,
    hideSnackbar,
    isLoading,
    welcomeDismissed,
    setWelcomeDismissed,
    syncStatus,
    isConnected,
  } = useApp();

  const [showArchivePrompt, setShowArchivePrompt] = useState(false);
  const [archiveYearSummary, setArchiveYearSummary] = useState<{
    transactionCount: number;
    closingNetWorth: number;
    closingBalances: Record<string, number>;
    closingAssetValuations: Record<string, number>;
  } | null>(null);
  const [archiveYear, setArchiveYear] = useState<number | null>(null);

  // Handle initial sync completion
  useEffect(() => {
    // Wait for sync to finish initializing
    if (syncStatus.isInitializing) return;

    // Connected and synced, check for archive prompt
    if (isConnected) {
      checkArchivePrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncStatus.isInitializing, isConnected]);

  const handleWelcomeClose = () => {
    setWelcomeDismissed(true);
  };

  const checkArchivePrompt = async () => {
    const archivableYear = await archiveService.identifyArchivableYear();
    if (archivableYear !== null) {
      const summary = await archiveService.calculateYearEndSummary(archivableYear, baseCurrency);
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
        open={!syncStatus.isInitializing && !isConnected && !welcomeDismissed}
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
      <BrowserRouter>
        <AppContent onReconnectNeeded={handleReconnectNeeded} />
      </BrowserRouter>
      <ReconnectDialog
        open={reconnectDialogState.open}
        providerName={reconnectDialogState.providerName}
        onReconnect={handleReconnect}
        onDismiss={handleReconnectDismiss}
      />
    </ThemeProvider>
  );
};

export default App;
