import React, { useEffect, useState } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Backdrop, CircularProgress } from '@mui/material';
import theme from './theme';
import { MainLayout } from './components/layout/MainLayout';
import { WelcomeDialog } from './components/onboarding/WelcomeDialog';
import { NotificationSnackbar } from './components/common/NotificationSnackbar';
import { MergePreviewDialog, ConflictResolution } from './components/common/MergePreviewDialog';
import ReconnectDialog from './components/common/ReconnectDialog';
import { ArchivePrompt } from './components/common/ArchivePrompt';
import { BackupPromptDialog } from './components/common/BackupPromptDialog';
import { AppRoutes } from './routes';
import { useAppStore } from './stores/useAppStore';
import {
  ServiceProvider,
  useSyncService,
  useStorageFactory,
  useBackupService,
  useArchiveService,
} from './contexts/ServiceProviders';
import { MergeResult } from './services/merge.service';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const storageFactory = useStorageFactory();
  const syncService = useSyncService();
  const backupService = useBackupService();
  const archiveService = useArchiveService();
  const { hasUnsavedChanges, snackbar, hideSnackbar, baseCurrency, lastBackupDate, isLoading } =
    useAppStore();
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showArchivePrompt, setShowArchivePrompt] = useState(false);
  const [showBackupPrompt, setShowBackupPrompt] = useState(false);
  const [archiveYearSummary, setArchiveYearSummary] = useState<any>(null);
  const [archiveYear, setArchiveYear] = useState<number | null>(null);
  const [mergeDialogState, setMergeDialogState] = useState<{
    open: boolean;
    mergeResult: MergeResult | null;
    resolve: ((value: ConflictResolution[] | null) => void) | null;
  }>({
    open: false,
    mergeResult: null,
    resolve: null,
  });
  const [reconnectDialogState, setReconnectDialogState] = useState<{
    open: boolean;
    providerName: string;
    resolve: ((value: 'reconnect' | 'dismiss') => void) | null;
  }>({
    open: false,
    providerName: '',
    resolve: null,
  });

  useEffect(() => {
    const initializeApp = async () => {
      // Set up merge handler
      syncService.setMergeHandler(async (mergeResult: MergeResult) => {
        return new Promise<ConflictResolution[] | null>((resolve) => {
          setMergeDialogState({
            open: true,
            mergeResult,
            resolve,
          });
        });
      });

      // Initialize storage provider
      const loaded = await storageFactory.initialize(async (providerName: string) => {
        return new Promise<'reconnect' | 'dismiss'>((resolve) => {
          setReconnectDialogState({
            open: true,
            providerName,
            resolve,
          });
        });
      });

      if (!loaded) {
        setShowWelcomeDialog(true);
        return;
      }

      const dataLoaded = await syncService.autoLoad();

      if (!dataLoaded) {
        setShowWelcomeDialog(true);
      } else {
        checkArchivePrompt();
        checkBackupPrompt();
      }
    };

    initializeApp();
    syncService.startAutoSave();

    return () => {
      syncService.stopAutoSave();
      syncService.setMergeHandler(null);
    };
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

  const checkBackupPrompt = () => {
    setShowBackupPrompt(backupService.shouldPromptBackup());
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Auto-reload data when tab becomes visible (with 30-minute throttle)
  useEffect(() => {
    let lastReloadTime = 0;
    const RELOAD_THROTTLE_MS = 30 * 60 * 1000; // 30 minutes

    const handleVisibilityChange = async () => {
      // Read fresh state values when event fires
      const state = useAppStore.getState();

      // Only reload if: tab is visible, no unsaved changes, and data is loaded
      if (document.hidden || state.hasUnsavedChanges || !state.baseVersion) {
        return;
      }

      const now = Date.now();
      if (now - lastReloadTime < RELOAD_THROTTLE_MS) {
        // Too soon since last reload, skip
        return;
      }

      lastReloadTime = now;
      await syncService.loadDataFile();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Register once on mount

  const handleMergeCancel = () => {
    if (mergeDialogState.resolve) {
      mergeDialogState.resolve(null);
    }
    setMergeDialogState({ open: false, mergeResult: null, resolve: null });
  };

  const handleMergeApply = (resolutions: ConflictResolution[]) => {
    if (mergeDialogState.resolve) {
      mergeDialogState.resolve(resolutions);
    }
    setMergeDialogState({ open: false, mergeResult: null, resolve: null });
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
    // Show welcome dialog when user dismisses reconnect
    setShowWelcomeDialog(true);
  };
  const handleArchiveGoToSettings = () => {
    setShowArchivePrompt(false);
    // Navigate to archive settings page using React Router
    navigate('/settings/archives');
  };

  const handleGoToBackupSettings = () => {
    setShowBackupPrompt(false);
    // Navigate to preferences page using React Router
    navigate('/settings/preferences');
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
      <MergePreviewDialog
        open={mergeDialogState.open}
        conflicts={mergeDialogState.mergeResult?.conflicts || []}
        autoMergedCount={mergeDialogState.mergeResult?.autoMergedCount || 0}
        onCancel={handleMergeCancel}
        onApply={handleMergeApply}
      />
      <ReconnectDialog
        open={reconnectDialogState.open}
        providerName={reconnectDialogState.providerName}
        onReconnect={handleReconnect}
        onDismiss={handleReconnectDismiss}
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
      <BackupPromptDialog
        open={showBackupPrompt}
        lastBackupDate={lastBackupDate}
        onGoToSettings={handleGoToBackupSettings}
        onDismiss={() => setShowBackupPrompt(false)}
      />
      <Backdrop open={isLoading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ServiceProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ServiceProvider>
    </ThemeProvider>
  );
};

export default App;
