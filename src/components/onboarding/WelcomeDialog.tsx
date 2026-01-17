import React, { useState } from 'react';
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
import { StorageProviderType } from '../../services/storage/StorageFactory';
import { FilePickerService } from '../../services/storage/FilePickerService';
import type { SelectedFileInfo as OneDriveFileInfo } from '../../services/storage/OneDriveProvider';
import type { SelectedFileInfo as GoogleDriveFileInfo } from '../../services/storage/GoogleDriveProvider';
import { useStorageFactory, useSyncService } from '../../contexts/ServiceProviders';
import { isUserCancellationError } from '../../utils/error.utils';

interface WelcomeDialogProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const storageFactory = useStorageFactory();
  const syncService = useSyncService();
  const [isConnecting, setIsConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showOneDriveFilePicker, setShowOneDriveFilePicker] = useState(false);
  const [showGoogleDriveFilePicker, setShowGoogleDriveFilePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'open' | 'create'>('open');

  const handleOpenOneDrive = async () => {
    setIsConnecting(true);
    setAuthError(null);
    setPickerMode('open');

    try {
      await storageFactory.authenticateOneDrive();
      setShowOneDriveFilePicker(true);
    } catch (error: any) {
      setIsConnecting(false);
      // Don't show error if user cancelled
      if (!isUserCancellationError(error)) {
        console.error('OneDrive connection failed:', error);
        setAuthError(error.message || 'Failed to connect to OneDrive');
      }
    }
  };

  const handleCreateOneDrive = async () => {
    setIsConnecting(true);
    setAuthError(null);
    setPickerMode('create');

    try {
      await storageFactory.authenticateOneDrive();
      setShowOneDriveFilePicker(true);
    } catch (error: any) {
      setIsConnecting(false);
      // Don't show error if user cancelled
      if (!isUserCancellationError(error)) {
        console.error('OneDrive connection failed:', error);
        setAuthError(error.message || 'Failed to connect to OneDrive');
      }
    }
  };

  const handleOpenGoogleDrive = async () => {
    setIsConnecting(true);
    setAuthError(null);
    setPickerMode('open');

    try {
      await storageFactory.authenticateGoogleDrive();
      setShowGoogleDriveFilePicker(true);
    } catch (error: any) {
      setIsConnecting(false);
      // Don't show error if user cancelled
      if (!isUserCancellationError(error)) {
        console.error('Google Drive connection failed:', error);
        setAuthError(error.message || 'Failed to connect to Google Drive');
      }
    }
  };

  const handleCreateGoogleDrive = async () => {
    setIsConnecting(true);
    setAuthError(null);
    setPickerMode('create');

    try {
      await storageFactory.authenticateGoogleDrive();
      setShowGoogleDriveFilePicker(true);
    } catch (error: any) {
      setIsConnecting(false);
      // Don't show error if user cancelled
      if (!isUserCancellationError(error)) {
        console.error('Google Drive connection failed:', error);
        setAuthError(error.message || 'Failed to connect to Google Drive');
      }
    }
  };

  const handleOneDriveFileSelect = async (fileInfo: OneDriveFileInfo) => {
    setShowOneDriveFilePicker(false);
    try {
      await storageFactory.replaceProvider({
        type: StorageProviderType.ONEDRIVE,
        fileInfo,
      });

      if (fileInfo.fileId) {
        // Load existing file
        await syncService.loadDataFile();
      } else {
        // Create new file
        await syncService.syncNow(true);
      }
      onClose();
    } catch (error) {
      // Don't show error if user cancelled
      if (!isUserCancellationError(error)) {
        console.error('OneDrive file selection failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to connect to OneDrive';
        setAuthError(errorMessage);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOneDriveFilePickerCancel = () => {
    setShowOneDriveFilePicker(false);
    setIsConnecting(false);
  };

  const handleGoogleDriveFileSelect = async (fileInfo: GoogleDriveFileInfo) => {
    setShowGoogleDriveFilePicker(false);
    try {
      await storageFactory.replaceProvider({
        type: StorageProviderType.GOOGLE_DRIVE,
        fileInfo,
      });

      if (fileInfo.fileId) {
        // Load existing file
        await syncService.loadDataFile();
      } else {
        // Create new file
        await syncService.syncNow(true);
      }
      onClose();
    } catch (error) {
      // Don't show error if user cancelled
      if (!isUserCancellationError(error)) {
        console.error('Google Drive file selection failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to connect to Google Drive';
        setAuthError(errorMessage);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGoogleDriveFilePickerCancel = () => {
    setShowGoogleDriveFilePicker(false);
    setIsConnecting(false);
  };

  const handleOpenLocalFile = async () => {
    setAuthError(null);
    try {
      const fileHandle = await FilePickerService.showOpenFilePicker();
      if (fileHandle) {
        await storageFactory.replaceProvider({
          type: StorageProviderType.LOCAL,
          fileHandle,
        });
        await syncService.loadDataFile();
        onClose();
      }
    } catch (error) {
      // Don't show error if user cancelled
      if (!isUserCancellationError(error)) {
        console.error('Failed to open local file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to open file';
        setAuthError(errorMessage);
      }
    }
  };

  const handleCreateNewLocalFile = async () => {
    setAuthError(null);
    try {
      const fileHandle = await FilePickerService.showSaveFilePicker('money-tree.json');
      if (fileHandle) {
        await storageFactory.replaceProvider({
          type: StorageProviderType.LOCAL,
          fileHandle,
        });
        await syncService.syncNow(true);
        onClose();
      }
    } catch (error) {
      // Don't show error if user cancelled
      if (!isUserCancellationError(error)) {
        console.error('Failed to create new file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create new file';
        setAuthError(errorMessage);
      }
    }
  };

  return (
    <>
      <Dialog
        open={open && !showOneDriveFilePicker && !showGoogleDriveFilePicker}
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

          {authError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {authError}
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
                  onClick={handleOpenLocalFile}
                  fullWidth
                >
                  Open Existing
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateNewLocalFile}
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
                  startIcon={isConnecting ? <CircularProgress size={20} /> : <FolderOpenIcon />}
                  onClick={handleOpenOneDrive}
                  disabled={!isOneDriveConfigured() || isConnecting}
                  fullWidth
                >
                  {isConnecting ? 'Connecting...' : 'Open Existing'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={isConnecting ? <CircularProgress size={20} /> : <AddIcon />}
                  onClick={handleCreateOneDrive}
                  disabled={!isOneDriveConfigured() || isConnecting}
                  fullWidth
                >
                  {isConnecting ? 'Connecting...' : 'Create New'}
                </Button>
              </CardActions>
            </Card>

            {/* Connect to Google Drive */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <CloudIcon
                    color={isGoogleDriveConfigured() ? 'primary' : 'disabled'}
                    fontSize="large"
                  />
                  <Box>
                    <Typography
                      variant="h6"
                      component="div"
                      color={isGoogleDriveConfigured() ? 'inherit' : 'text.disabled'}
                    >
                      Connect to Google Drive
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isGoogleDriveConfigured()
                        ? 'Sync your data with Google Drive'
                        : 'Not configured - Google Cloud Console setup required'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={isConnecting ? <CircularProgress size={20} /> : <FolderOpenIcon />}
                  onClick={handleOpenGoogleDrive}
                  disabled={!isGoogleDriveConfigured() || isConnecting}
                  fullWidth
                >
                  {isConnecting ? 'Connecting...' : 'Open Existing'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={isConnecting ? <CircularProgress size={20} /> : <AddIcon />}
                  onClick={handleCreateGoogleDrive}
                  disabled={!isGoogleDriveConfigured() || isConnecting}
                  fullWidth
                >
                  {isConnecting ? 'Connecting...' : 'Create New'}
                </Button>
              </CardActions>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            You can change your data storage location later in Settings
          </Typography>
        </DialogActions>
      </Dialog>

      {/* OneDrive File Picker */}
      <OneDriveFilePicker
        open={showOneDriveFilePicker}
        mode={pickerMode}
        onSelect={handleOneDriveFileSelect}
        onCancel={handleOneDriveFilePickerCancel}
        onListFolders={storageFactory.listOneDriveFolders}
      />

      {/* Google Drive File Picker */}
      <GoogleDriveFilePicker
        open={showGoogleDriveFilePicker}
        mode={pickerMode}
        onSelect={handleGoogleDriveFileSelect}
        onCancel={handleGoogleDriveFilePickerCancel}
        onListFiles={storageFactory.listGoogleDriveFiles}
      />
    </>
  );
};
