import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { MainLayout } from './components/layout/MainLayout';
import { WelcomeDialog } from './components/onboarding/WelcomeDialog';
import { CloudFilePicker } from './components/common/CloudFilePicker';
import { NotificationSnackbar } from './components/common/NotificationSnackbar';
import { ArchivePrompt } from './components/common/ArchivePrompt';
import { AppRoutes } from './routes';
import { useApp, AppProvider } from '@/contexts/AppContext';
import { useSync, SyncProvider } from '@/contexts/SyncContext';
import { StoreProvider, useStore } from '@/contexts/StoreContext';
import { useArchivePrompt } from '@/hooks/useArchivePrompt';
import type { CloudItem } from './services/storage/IStorageProvider';

const AppContent: React.FC = () => {
  const syncOps = useSync();
  const { syncStatus } = syncOps;
  const { baseCurrency } = useStore();
  const {
    snackbar,
    hideSnackbar,
    showWelcomeDialog,
    setShowWelcomeDialog,
    showFileSelection,
    setShowFileSelection,
  } = useApp();

  const {
    showPrompt: showArchivePrompt,
    archiveYear,
    archiveYearSummary,
    handleGoToSettings: handleArchiveGoToSettings,
    handleRemindLater: handleArchiveRemindLater,
  } = useArchivePrompt();

  const handleWelcomeClose = () => {
    setShowWelcomeDialog(false);
  };

  const handleFileSelected = async (fileItem: CloudItem) => {
    try {
      // Set the file in sync context (clears DB and triggers sync automatically)
      await syncOps.selectFile(fileItem);
      setShowFileSelection(false);
    } catch (error) {
      console.error('[App] File selection error:', error);
      setShowFileSelection(false);
    }
  };

  const handleFilePickerCancel = async () => {
    try {
      // User cancelled file selection - disconnect provider and return to welcome
      await syncOps.disconnect();
      setShowFileSelection(false);
    } catch (error) {
      console.error('[App] Cancel file selection error:', error);
      setShowFileSelection(false);
    }
  };

  return (
    <>
      <MainLayout>
        <AppRoutes />
      </MainLayout>
      <WelcomeDialog open={showWelcomeDialog} onClose={handleWelcomeClose} />
      {showFileSelection && syncStatus.providerName && (
        <CloudFilePicker
          open={showFileSelection}
          providerName={syncStatus.providerName}
          onListItems={syncOps.listItems}
          onFileSelected={handleFileSelected}
          onCancel={handleFilePickerCancel}
        />
      )}
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
          onRemindLater={handleArchiveRemindLater}
        />
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppProvider>
          <SyncProvider>
            <StoreProvider>
              <AppContent />
            </StoreProvider>
          </SyncProvider>
        </AppProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
