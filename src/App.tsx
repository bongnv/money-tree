import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { MainLayout } from './components/layout/MainLayout';
import { WelcomeDialog } from './components/onboarding/WelcomeDialog';
import { CloudFilePicker } from './components/common/CloudFilePicker';
import { NotificationSnackbar } from './components/common/NotificationSnackbar';
import ReconnectDialog from './components/common/ReconnectDialog';
import { ArchivePrompt } from './components/common/ArchivePrompt';
import { AppRoutes } from './routes';
import { useBaseCurrency } from '@hooks/useSyncMetadata';
import { useApp } from '@/hooks/useApp';
import { useSync } from '@/hooks/useSync';
import { useArchivePrompt } from '@/hooks/useArchivePrompt';
import { CurrencyCode } from '@/types/enums';
import type { CloudItem } from './services/storage/IStorageProvider';

const AppContent: React.FC<{
  onReconnectNeeded: (providerName: string) => Promise<'reconnect' | 'dismiss'>;
}> = ({ onReconnectNeeded }) => {
  const syncOps = useSync(onReconnectNeeded);
  const baseCurrency = useBaseCurrency() ?? CurrencyCode.USD;
  const {
    snackbar,
    hideSnackbar,
    showWelcomeDialog,
    setShowWelcomeDialog,
    showFileSelection,
    setShowFileSelection,
    syncStatus,
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
