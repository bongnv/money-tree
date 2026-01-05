import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
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
import { OneDriveFilePicker } from './components/onedrive/OneDriveFilePicker';
import { AppRoutes } from './routes';
import { useAppStore } from './stores/useAppStore';
import { syncService } from './services/sync.service';
import { StorageFactory, StorageProviderType } from './services/storage/StorageFactory';
import { OneDriveProvider } from './services/storage/OneDriveProvider';
import { SelectedFileInfo } from './components/onedrive/OneDriveFilePicker';
import { MergeResult } from './services/merge.service';
import {
  shouldPromptArchive,
  identifyArchivableYears,
  calculateYearEndSummary,
  createArchiveFile,
  saveArchiveFile,
  updateMainFileAfterArchive,
} from './services/archive.service';

const WELCOME_DISMISSED_KEY = 'moneyTree.welcomeDismissed';

const App: React.FC = () => {
  const {
    error,
    setError,
    hasUnsavedChanges,
    currentYear,
    snackbar,
    hideSnackbar,
    showSnackbar,
    baseCurrency,
    archivePromptPostponedAt,
    setArchivePromptPostponedAt,
    isLoading,
  } = useAppStore();
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showArchivePrompt, setShowArchivePrompt] = useState(false);
  const [archiveYearSummary, setArchiveYearSummary] = useState<any>(null);
  const [archiveYear, setArchiveYear] = useState<number | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [mergeDialogState, setMergeDialogState] = useState<{
    open: boolean;
    mergeResult: MergeResult | null;
    resolve: ((value: ConflictResolution[] | null) => void) | null;
  }>({
    open: false,
    mergeResult: null,
    resolve: null,
  });
  const [onedrivePickerState, setOnedrivePickerState] = useState<{
    open: boolean;
    defaultFileName: string;
  }>({
    open: false,
    defaultFileName: 'money-tree.json',
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
      } else {
        // File loaded successfully, check if archive prompt should be shown
        checkArchivePrompt();
      }
    };

    initializeApp();
    syncService.startAutoSave();

    // Set up OneDrive picker handler
    const handleOnedrivePickerOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ defaultFileName: string }>;
      setOnedrivePickerState({
        open: true,
        defaultFileName: customEvent.detail.defaultFileName,
      });
    };

    window.addEventListener('onedrive-file-picker-open', handleOnedrivePickerOpen);

    return () => {
      syncService.stopAutoSave();
      syncService.setMergeHandler(null);
      window.removeEventListener('onedrive-file-picker-open', handleOnedrivePickerOpen);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const checkArchivePrompt = () => {
    if (shouldPromptArchive(archivePromptPostponedAt)) {
      const archivableYears = identifyArchivableYears();
      if (archivableYears.length > 0) {
        const oldestYear = archivableYears[0];
        const summary = calculateYearEndSummary(oldestYear, baseCurrency);
        setArchiveYear(oldestYear);
        setArchiveYearSummary(summary);
        setShowArchivePrompt(true);
      }
    }
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

      // Get OneDrive provider and authenticate if needed
      const provider = StorageFactory.getCurrentProvider() as OneDriveProvider;
      await provider.initialize();

      // Only authenticate if not already authenticated (prevents double auth popup)
      if (!provider.isAuthenticated()) {
        await provider.authenticate();
      }

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

  const handleOnedrivePickerSelect = (fileInfo: SelectedFileInfo) => {
    const provider = StorageFactory.getCurrentProvider();
    if (provider instanceof OneDriveProvider) {
      provider.resolveFilePicker(fileInfo);
    }
    setOnedrivePickerState({ open: false, defaultFileName: 'money-tree.json' });
  };

  const handleOnedrivePickerCancel = () => {
    const provider = StorageFactory.getCurrentProvider();
    if (provider instanceof OneDriveProvider) {
      provider.rejectFilePicker();
    }
    setOnedrivePickerState({ open: false, defaultFileName: 'money-tree.json' });
  };

  const handleArchiveNow = async () => {
    if (!archiveYear) return;

    setShowArchivePrompt(false);
    setIsArchiving(true);

    try {
      // Create archive file
      const archiveFile = createArchiveFile(archiveYear, baseCurrency);

      // Save archive file
      const fileName = await saveArchiveFile(archiveFile);

      // Create archive reference
      const archiveReference = {
        year: archiveYear,
        fileName,
        archivedDate: archiveFile.archivedDate,
        summary: archiveFile.summary,
      };

      // Update main file - remove archived data
      updateMainFileAfterArchive(archiveYear, archiveReference);

      // Sync changes to storage
      await syncService.syncNow();

      showSnackbar(
        `Year ${archiveYear} archived successfully. Data has been removed from the main file.`,
        'success'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to archive year';
      showSnackbar(message, 'error');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleArchiveRemindLater = () => {
    setShowArchivePrompt(false);
    setArchivePromptPostponedAt(new Date().toISOString());
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
      {archiveYearSummary && archiveYear && (
        <ArchivePrompt
          open={showArchivePrompt}
          year={archiveYear}
          yearSummary={archiveYearSummary}
          baseCurrency={baseCurrency}
          onArchiveNow={handleArchiveNow}
          onRemindLater={handleArchiveRemindLater}
        />
      )}
      <OneDriveFilePicker
        open={onedrivePickerState.open}
        defaultFileName={onedrivePickerState.defaultFileName}
        onSelect={handleOnedrivePickerSelect}
        onCancel={handleOnedrivePickerCancel}
        onListFolders={handleListOneDriveFolders}
      />
      <Backdrop
        open={isLoading || isArchiving}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </ThemeProvider>
  );
};

export default App;
