import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  FolderOpen as FolderOpenIcon,
  FiberManualRecord as DotIcon,
  Home as HomeIcon,
  AccountBalance as AccountsIcon,
  Category as CategoryIcon,
  ReceiptLong as TransactionsIcon,
} from '@mui/icons-material';
import { useAppStore } from '../../stores/useAppStore';
import { syncService } from '../../services/sync.service';
import { formatDistance } from 'date-fns';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    fileName,
    lastSaved,
    hasUnsavedChanges,
    isLoading,
    currentYear,
  } = useAppStore();

  const handleLoad = async () => {
    try {
      const canProceed = await syncService.promptSaveIfNeeded();
      if (!canProceed) {
        return;
      }

      await syncService.loadDataFile(currentYear);
    } catch (error) {
      console.error('Load failed:', error);
    }
  };

  const handleSave = async () => {
    try {
      await syncService.saveNow();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const getLastSavedText = (): string => {
    if (!lastSaved) {
      return 'Never saved';
    }
    try {
      return formatDistance(new Date(lastSaved), new Date(), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ mr: 4 }}>
          Money Tree
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{
              backgroundColor: location.pathname === '/' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            }}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            startIcon={<AccountsIcon />}
            onClick={() => navigate('/accounts')}
            sx={{
              backgroundColor: location.pathname === '/accounts' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            }}
          >
            Accounts
          </Button>
          <Button
            color="inherit"
            startIcon={<CategoryIcon />}
            onClick={() => navigate('/categories')}
            sx={{
              backgroundColor: location.pathname === '/categories' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            }}
          >
            Categories
          </Button>
          <Button
            color="inherit"
            startIcon={<TransactionsIcon />}
            onClick={() => navigate('/transactions')}
            sx={{
              backgroundColor: location.pathname === '/transactions' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            }}
          >
            Transactions
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {fileName && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                {fileName}
              </Typography>
              {hasUnsavedChanges && (
                <DotIcon sx={{ fontSize: 12, color: 'warning.main' }} />
              )}
            </Box>
          )}

          <Typography variant="caption" color="inherit" sx={{ opacity: 0.7 }}>
            {getLastSavedText()}
          </Typography>

          <Button
            color="inherit"
            startIcon={<FolderOpenIcon />}
            onClick={handleLoad}
            disabled={isLoading}
          >
            Load
          </Button>

          <Button
            color="inherit"
            startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isLoading || !hasUnsavedChanges}
          >
            Save
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

