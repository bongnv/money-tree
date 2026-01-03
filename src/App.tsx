import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { MainLayout } from './components/layout/MainLayout';
import { FileLoadErrorDialog } from './components/common/FileLoadErrorDialog';
import { WelcomeDialog } from './components/common/WelcomeDialog';
import { AppRoutes } from './routes';
import { useAppStore } from './stores/useAppStore';
import { syncService } from './services/sync.service';

const WELCOME_DISMISSED_KEY = 'moneyTree.welcomeDismissed';

const App: React.FC = () => {
  const { error, setError, hasUnsavedChanges, currentYear } = useAppStore();
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
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

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      syncService.stopAutoSave();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleOpenLocalFile = async () => {
    try {
      await syncService.loadDataFile(currentYear);
      setShowWelcomeDialog(false);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleConnectOneDrive = () => {
    // Will be implemented in Phase 11.4
    console.log('OneDrive integration coming soon');
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
      />
      <FileLoadErrorDialog open={!!error} error={error} onClose={handleCloseError} />
    </ThemeProvider>
  );
};

export default App;
