import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  FolderOpen as FolderOpenIcon,
  Cloud as CloudIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { isOneDriveConfigured } from '../../config/onedrive.config';
import { isGoogleDriveConfigured } from '../../config/googledrive.config';
import { CloudFilePicker } from '../common/CloudFilePicker';
import { useSyncService } from '../../contexts/SyncProvider';
import { StorageProviderType } from '../../services/storage/StorageProviderFactory';
import { isUserCancellationError } from '../../utils/error.utils';
import type { CloudItem } from '../../services/storage/IStorageProvider';
import { db } from '../../db/database';

interface WelcomeDialogProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const syncService = useSyncService();

  const [state, setState] = useState({
    isConnecting: false,
    error: null as string | null,
    showFilePicker: false,
    pickerMode: 'open' as 'open' | 'create',
  });

  const handleConnect = useCallback(
    async (provider: StorageProviderType, mode: 'open' | 'create') => {
      setState((s) => ({ ...s, isConnecting: true, error: null, pickerMode: mode }));

      try {
        // Cloud: authenticate then show picker
        await syncService.connect(provider);
        setState((s) => ({
          ...s,
          showFilePicker: true,
        }));
      } catch (error: any) {
        setState((s) => ({ ...s, isConnecting: false }));
        if (!isUserCancellationError(error)) {
          setState((s) => ({ ...s, error: error.message }));
        }
      }
    },
    [syncService]
  );

  const handleFileSelected = useCallback(
    async (fileItem: CloudItem) => {
      setState((s) => ({ ...s, showFilePicker: false }));

      try {
        // Clear Dexie database for fresh start
        await db.delete();
        await db.open();

        // Set the file in sync context
        // SyncProvider will automatically trigger sync
        syncService.setFile(fileItem);

        setState((s) => ({ ...s, isConnecting: false }));
        onClose();
      } catch (error: any) {
        setState((s) => ({ ...s, isConnecting: false }));
        if (!isUserCancellationError(error)) {
          setState((s) => ({ ...s, error: error.message }));
        }
      }
    },
    [syncService, onClose]
  );

  const cancelPicker = useCallback(() => {
    setState((s) => ({
      ...s,
      showFilePicker: false,
      isConnecting: false,
    }));
  }, []);

  return (
    <>
      <Dialog
        open={open && !state.showFilePicker}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        sx={{ zIndex: 1000 }}
      >
        <DialogTitle>
          <Typography variant="h5" component="div" fontWeight="bold">
            Welcome to Money Tree
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Choose how you&apos;d like to manage your financial data:
          </Typography>

          {state.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {state.error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Connect to OneDrive */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <CloudIcon
                    color={isOneDriveConfigured() ? 'primary' : 'disabled'}
                    fontSize="large"
                  />
                  <Box>
                    <Typography
                      variant="h6"
                      component="div"
                      color={isOneDriveConfigured() ? 'inherit' : 'text.disabled'}
                    >
                      Connect to OneDrive
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isOneDriveConfigured()
                        ? 'Sync your data with Microsoft OneDrive'
                        : 'Not configured - Azure app registration required'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={
                    state.isConnecting ? <CircularProgress size={20} /> : <FolderOpenIcon />
                  }
                  onClick={() => handleConnect(StorageProviderType.ONEDRIVE, 'open')}
                  disabled={!isOneDriveConfigured() || state.isConnecting}
                  fullWidth
                >
                  {state.isConnecting ? 'Connecting...' : 'Open Existing'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={state.isConnecting ? <CircularProgress size={20} /> : <AddIcon />}
                  onClick={() => handleConnect(StorageProviderType.ONEDRIVE, 'create')}
                  disabled={!isOneDriveConfigured() || state.isConnecting}
                  fullWidth
                >
                  {state.isConnecting ? 'Connecting...' : 'Create New'}
                </Button>
              </CardActions>
            </Card>

            {/* Connect to Google Drive */}
            {isGoogleDriveConfigured() && (
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <CloudIcon color="primary" fontSize="large" />
                    <Box>
                      <Typography variant="h6" component="div">
                        Connect to Google Drive
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sync your data with Google Drive
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={
                      state.isConnecting ? <CircularProgress size={20} /> : <FolderOpenIcon />
                    }
                    onClick={() => handleConnect(StorageProviderType.GOOGLE_DRIVE, 'open')}
                    disabled={state.isConnecting}
                    fullWidth
                  >
                    {state.isConnecting ? 'Connecting...' : 'Open Existing'}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={state.isConnecting ? <CircularProgress size={20} /> : <AddIcon />}
                    onClick={() => handleConnect(StorageProviderType.GOOGLE_DRIVE, 'create')}
                    disabled={state.isConnecting}
                    fullWidth
                  >
                    {state.isConnecting ? 'Connecting...' : 'Create New'}
                  </Button>
                </CardActions>
              </Card>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            You can disconnect from this file later in Settings. By using Money Tree, you agree to
            our{' '}
            <a
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              Privacy Policy
            </a>
            .
          </Typography>
        </DialogActions>
      </Dialog>

      {/* Generic Cloud File Picker */}
      {state.showFilePicker && syncService.providerName && (
        <CloudFilePicker
          open={state.showFilePicker}
          providerName={syncService.providerName}
          onListItems={syncService.listItems}
          mode={state.pickerMode}
          onFileSelected={handleFileSelected}
          onCancel={cancelPicker}
        />
      )}
    </>
  );
};
