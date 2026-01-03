import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { MainLayout } from './components/layout/MainLayout';
import { FileLoadErrorDialog } from './components/common/FileLoadErrorDialog';
import { WelcomeDialog } from './components/common/WelcomeDialog';
import { NotificationSnackbar } from './components/common/NotificationSnackbar';
import { MergePreviewDialog, ConflictResolution } from './components/common/MergePreviewDialog';
import { AppRoutes } from './routes';
import { useAppStore } from './stores/useAppStore';
import { syncService } from './services/sync.service';
import { StorageFactory, StorageProviderType } from './services/storage/StorageFactory';
import { OneDriveProvider } from './services/storage/OneDriveProvider';
import { SelectedFileInfo } from './components/onedrive/OneDriveFilePicker';
import { MergeResult } from './services/merge.service';

const WELCOME_DISMISSED_KEY = 'moneyTree.welcomeDismissed';

const App: React.FC = () => {
  const { error, setError, hasUnsavedChanges, currentYear, snackbar, hideSnackbar } = useAppStore();
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
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

      // Try to auto-load from cached file
      const loaded = await syncService.autoLoad();

      if (!loaded) {
        // Check if user has dismissed the welcome dialog
        const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY);
        if (!dismissed) {
          setShowWelcomeDialog(true);
        }
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

  const handleOpenLocalFile = async () => {
    try {
      // Make sure we're using local storage provider
      StorageFactory.setProviderType(StorageProviderType.LOCAL);
      await syncService.loadDataFile(currentYear);
      setShowWelcomeDialog(false);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleConnectOneDrive = async (fileInfo?: SelectedFileInfo) => {
    try {
      // Switch to OneDrive provider
      StorageFactory.setProviderType(StorageProviderType.ONEDRIVE);

      // Get OneDrive provider and authenticate
      const provider = StorageFactory.getCurrentProvider() as OneDriveProvider;
      await provider.initialize();
      await provider.authenticate();

      // Set selected file location if provided
      if (fileInfo) {
        provider.setSelectedFile(fileInfo);
      }

      // Try to load existing file from OneDrive
      try {
        await syncService.loadDataFile(currentYear);
      } catch (error) {
        // If no file exists, that's OK - user will start with empty data
        console.log('No existing file in OneDrive, starting fresh');
      }

      setShowWelcomeDialog(false);
    } catch (error) {
      console.error('OneDrive connection failed:', error);
      throw error; // Re-throw so WelcomeDialog can show error
    }
  };

  const handleListOneDriveFolders = async (parentItem?: any) => {
    // Switch to OneDrive provider temporarily to use its API
    StorageFactory.setProviderType(StorageProviderType.ONEDRIVE);
    const provider = StorageFactory.getCurrentProvider() as OneDriveProvider;
    await provider.initialize();

    // If not authenticated yet, authenticate first
    if (!provider.isAuthenticated()) {
      await provider.authenticate();
    }

    return provider.listFolders(parentItem);
  };

  const handleStartEmpty = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
    }
    setShowWelcomeDialog(false);
    // User will be prompted to save when they make their first change
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </BrowserRouter>
      <WelcomeDialog
        open={showWelcomeDialog}
        onOpenLocalFile={handleOpenLocalFile}
        onConnectOneDrive={handleConnectOneDrive}
        onStartEmpty={handleStartEmpty}
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
    </ThemeProvider>
  );
};

export default App;
