import React, { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography, Button } from '@mui/material';
import theme from './theme';
import { Header } from './components/layout/Header';
import { FileLoadErrorDialog } from './components/common/FileLoadErrorDialog';
import { useAppStore } from './stores/useAppStore';
import { syncService } from './services/sync.service';

const App: React.FC = () => {
  const { error, setError, hasUnsavedChanges } = useAppStore();

  useEffect(() => {
    // Start periodic auto-save
    syncService.startAutoSave();

    // Handle browser close/refresh with unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Modern browsers require this
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
      <Header />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h1" component="h1" gutterBottom>
            Money Tree
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
            Personal Finance Manager
          </Typography>
          <Button variant="contained" color="primary" sx={{ mt: 2 }}>
            Get Started
          </Button>
        </Box>
      </Container>
      <FileLoadErrorDialog
        open={!!error}
        error={error}
        onClose={handleCloseError}
      />
    </ThemeProvider>
  );
};

export default App;
