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
import { OneDriveFilePicker } from '../onedrive/OneDriveFilePicker';
import { GoogleDriveFilePicker } from '../googledrive/GoogleDriveFilePicker';
import { useStorage, useSyncService } from '../../contexts/ServiceProviders';
import { StorageProviderType } from '../../services/storage/StorageService';
import { FilePickerService } from '../../services/storage/FilePickerService';
import { isUserCancellationError } from '../../utils/error.utils';
import type { LocalStorageProvider } from '../../services/storage/LocalStorageProvider';

interface WelcomeDialogProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const storage = useStorage();
  const syncService = useSyncService();

  const [state, setState] = useState({
    isConnecting: false,
    error: null as string | null,
    showOneDrivePicker: false,
    showGoogleDrivePicker: false,
    pickerMode: 'open' as 'open' | 'create',
  });

  const handleConnect = useCallback(
    async (provider: StorageProviderType, mode: 'open' | 'create') => {
      setState((s) => ({ ...s, isConnecting: true, error: null, pickerMode: mode }));

      try {
        if (provider === StorageProviderType.LOCAL) {
          // Local: show file picker immediately
          const fileHandle =
            mode === 'open'
              ? await FilePickerService.showOpenFilePicker()
              : await FilePickerService.showSaveFilePicker('money-tree.json');

          if (fileHandle) {
            await storage.connect({ type: provider });

            // Set file on the provider
            const localProvider = storage.provider as LocalStorageProvider;
            await localProvider.setFile(fileHandle);

            // Load or create file
            if (mode === 'open') {
              await syncService.loadDataFile();
            } else {
              await syncService.syncNow(true);
            }

            setState((s) => ({ ...s, isConnecting: false }));
            onClose();
          } else {
            setState((s) => ({ ...s, isConnecting: false }));
          }
        } else {
          // Cloud: authenticate then show picker
          await storage.connect({ type: provider });
          setState((s) => ({
            ...s,
            showOneDrivePicker: provider === StorageProviderType.ONEDRIVE,
            showGoogleDrivePicker: provider === StorageProviderType.GOOGLE_DRIVE,
          }));
        }
      } catch (error: any) {
        setState((s) => ({ ...s, isConnecting: false }));
        if (!isUserCancellationError(error)) {
          setState((s) => ({ ...s, error: error.message }));
        }
      }
    },
    [storage, syncService, onClose]
  );

  const handleFileSelected = useCallback(
    async (hasExistingFile: boolean) => {
      setState((s) => ({ ...s, showOneDrivePicker: false, showGoogleDrivePicker: false }));

      try {
        // Provider has already called setFile() in the picker
        // Load existing file or create new
        if (hasExistingFile) {
          await syncService.loadDataFile();
        } else {
          await syncService.syncNow(true);
        }

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
      showOneDrivePicker: false,
      showGoogleDrivePicker: false,
      isConnecting: false,
    }));
  }, []);

  return (
    <>
      <Dialog
        open={open && !state.showOneDrivePicker && !state.showGoogleDrivePicker}
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
            {/* Local File Storage */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <FolderOpenIcon color="primary" fontSize="large" />
                  <Box>
                    <Typography variant="h6" component="div">
                      Local File Storage
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Store your Money Tree data in a file on your computer
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FolderOpenIcon />}
                  onClick={() => handleConnect(StorageProviderType.LOCAL, 'open')}
                  fullWidth
                >
                  Open Existing
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleConnect(StorageProviderType.LOCAL, 'create')}
                  fullWidth
                >
                  Create New
                </Button>
              </CardActions>
            </Card>

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
          <Typography variant="caption" color="text.secondary">
            You can change your data storage location later in Settings
          </Typography>
        </DialogActions>
      </Dialog>

      {/* OneDrive File Picker */}
      {state.showOneDrivePicker && (
        <OneDriveFilePicker
          open={state.showOneDrivePicker}
          mode={state.pickerMode}
          onComplete={handleFileSelected}
          onCancel={cancelPicker}
        />
      )}

      {/* Google Drive File Picker */}
      {state.showGoogleDrivePicker && (
        <GoogleDriveFilePicker
          open={state.showGoogleDrivePicker}
          mode={state.pickerMode}
          onComplete={handleFileSelected}
          onCancel={cancelPicker}
        />
      )}
    </>
  );
};
