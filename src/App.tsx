import React, { useEffect, useState } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Backdrop, CircularProgress } from '@mui/material';
import theme from './theme';
import { MainLayout } from './components/layout/MainLayout';
import { FileLoadErrorDialog } from './components/common/FileLoadErrorDialog';
import { WelcomeDialog } from './components/common/WelcomeDialog';
import { NotificationSnackbar } from './components/common/NotificationSnackbar';
import { MergePreviewDialog, ConflictResolution } from './components/common/MergePreviewDialog';
import { ArchivePrompt } from './components/common/ArchivePrompt';
import { BackupPromptDialog } from './components/common/BackupPromptDialog';
import { AppRoutes } from './routes';
import { useAppStore } from './stores/useAppStore';
import { syncService } from './services/sync.service';
import { FilePickerService } from './services/storage/FilePickerService';
import { StorageFactory, StorageProviderType } from './services/storage/StorageFactory';
import { SelectedFileInfo } from './services/storage/OneDriveProvider';
import { MergeResult } from './services/merge.service';
import { backupService } from './services/backup.service';
import { identifyArchivableYear, calculateYearEndSummary } from './services/archive.service';

const WELCOME_DISMISSED_KEY = 'moneyTree.welcomeDismissed';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const {
    error,
    setError,
    hasUnsavedChanges,
    snackbar,
    hideSnackbar,
    baseCurrency,
    lastBackupDate,
    isLoading,
  } = useAppStore();
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

      // Initialize provider from cached storage
      const initialized = await StorageFactory.initializeProvider();

      // Try to auto-load from cached file (only if provider was initialized)
      const loaded = initialized && (await syncService.autoLoad());

      if (!loaded) {
        // Check if user has dismissed the welcome dialog
        const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY);
        if (!dismissed) {
          setShowWelcomeDialog(true);
        }
      } else {
        // File loaded successfully, check if archive and backup prompts should be shown
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
    const archivableYear = identifyArchivableYear();
    if (archivableYear !== null) {
      const summary = calculateYearEndSummary(archivableYear, baseCurrency);
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

  const handleOpenLocalFile = async () => {
    try {
      // Show file picker to select a local file
      const fileHandle = await FilePickerService.showOpenFilePicker();
      if (!fileHandle) {
        // User cancelled
        return;
      }

      // Switch to local storage provider with selected file
      await StorageFactory.replaceProvider(StorageProviderType.LOCAL, { fileHandle });

      // Load data from the selected file
      await syncService.loadDataFile();
      setShowWelcomeDialog(false);
    } catch (error) {
      console.error('Failed to open file:', error);
      throw error; // Re-throw so WelcomeDialog can show error
    }
  };

  const handleCreateNewLocalFile = async () => {
    try {
      // Show save file picker to create a new file
      const fileHandle = await FilePickerService.showSaveFilePicker('money-tree.json');
      if (!fileHandle) {
        // User cancelled
        return;
      }

      // Switch to local storage provider with new file
      await StorageFactory.replaceProvider(StorageProviderType.LOCAL, { fileHandle });

      // File will be empty initially, no need to load
      setShowWelcomeDialog(false);
    } catch (error) {
      console.error('Failed to create new file:', error);
      throw error; // Re-throw so WelcomeDialog can show error
    }
  };

  const handleSelectOneDrive = async () => {
    const service = StorageFactory.getOneDriveService();
    await service.authenticate();
  };

  const handleConnectOneDrive = async (fileInfo: SelectedFileInfo) => {
    // Finalize connection: switch provider and load file
    await StorageFactory.replaceProvider(StorageProviderType.ONEDRIVE, { fileInfo });

    await syncService.loadDataFile();
    setShowWelcomeDialog(false);
  };

  const handleListOneDriveFolders = async (parentItem?: any) => {
    const service = StorageFactory.getOneDriveService();
    return service.listFolders(parentItem);
  };

  const handleCloseError = () => {
    setError(null);
  };

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
      <WelcomeDialog
        open={showWelcomeDialog}
        onOpenLocalFile={handleOpenLocalFile}
        onCreateNewLocalFile={handleCreateNewLocalFile}
        onSelectOneDrive={handleSelectOneDrive}
        onOneDriveFileSelected={handleConnectOneDrive}
        onListOneDriveFolders={handleListOneDriveFolders}
      />
      <FileLoadErrorDialog open={!!error} error={error} onClose={handleCloseError} />
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
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
