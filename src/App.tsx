import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Button } from '@mui/material';
import theme from './theme';
import { MainLayout } from './components/layout/MainLayout';
import { FileLoadErrorDialog } from './components/common/FileLoadErrorDialog';
import { AccountsPage } from './components/accounts/AccountsPage';
import { useAppStore } from './stores/useAppStore';
import { syncService } from './services/sync.service';

const DashboardPage: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Money Tree
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom color="text.secondary">
        Personal Finance Manager
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Dashboard coming soon. Start by managing your accounts.
      </Typography>
      <Button variant="contained" color="primary" href="/accounts">
        Manage Accounts
      </Button>
    </Box>
  );
};

const App: React.FC = () => {
  const { error, setError, hasUnsavedChanges } = useAppStore();

  useEffect(() => {
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

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
      <FileLoadErrorDialog
        open={!!error}
        error={error}
        onClose={handleCloseError}
      />
    </ThemeProvider>
  );
};

export default App;
