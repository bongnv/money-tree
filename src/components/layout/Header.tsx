import React from 'react';
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
} from '@mui/icons-material';
import { useAppStore } from '../../stores/useAppStore';
import { syncService } from '../../services/sync.service';
import { formatDistance } from 'date-fns';

export const Header: React.FC = () => {
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
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Money Tree
        </Typography>

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

