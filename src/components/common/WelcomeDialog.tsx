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
import { GooglePickerService } from '../../services/storage/GooglePickerService';
import { StorageFactory } from '../../services/storage/StorageFactory';
import type { SelectedFileInfo as OneDriveFileInfo } from '../../services/storage/OneDriveProvider';
import type { SelectedFileInfo as GoogleDriveFileInfo } from '../../services/storage/GoogleDriveProvider';

interface WelcomeDialogProps {
  open: boolean;
  onOpenLocalFile: () => void;
  onCreateNewLocalFile: () => void;
  onSelectOneDrive: () => Promise<void>;
  onOneDriveFileSelected: (fileInfo: OneDriveFileInfo) => Promise<void>;
  onListOneDriveFolders: (parentItem?: any) => Promise<any[]>;
  onSelectGoogleDrive: () => Promise<void>;
  onGoogleDriveFileSelected: (fileInfo: GoogleDriveFileInfo) => Promise<void>;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({
  open,
  onOpenLocalFile,
  onCreateNewLocalFile,
  onSelectOneDrive,
  onOneDriveFileSelected,
  onListOneDriveFolders,
  onSelectGoogleDrive,
  onGoogleDriveFileSelected,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isConnecting, setIsConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showOneDriveFilePicker, setShowOneDriveFilePicker] = useState(false);

  const handleConnectOneDrive = async () => {
    setIsConnecting(true);
    setAuthError(null);

    try {
      await onSelectOneDrive();
      setShowOneDriveFilePicker(true);
    } catch (error: any) {
      console.error('OneDrive connection failed:', error);
      setAuthError(error.message || 'Failed to connect to OneDrive');
      setIsConnecting(false);
    }
  };

  const handleConnectGoogleDrive = async () => {
    setIsConnecting(true);
    setAuthError(null);

    try {
      // Authenticate with Google Drive
      await onSelectGoogleDrive();

      // Get access token for Picker
      const accessToken = StorageFactory.getGoogleDriveAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Show Google Picker
      const pickerResult = await GooglePickerService.showPicker(accessToken, true);

      if (pickerResult) {
        // Check if user selected a folder or a file
        const isFolder = pickerResult.mimeType === 'application/vnd.google-apps.folder';

        // Convert picker result to SelectedFileInfo format
        const fileInfo: GoogleDriveFileInfo = {
          fileId: isFolder ? null : pickerResult.id, // No fileId if folder (means create new)
          fileName: isFolder ? 'MoneyTree.json' : pickerResult.name,
          parentId: isFolder ? pickerResult.id : (pickerResult.parentId ?? undefined), // If folder selected, use it as parent
        };

        await onGoogleDriveFileSelected(fileInfo);
      }
    } catch (error: any) {
      console.error('Google Drive connection failed:', error);
      setAuthError(error.message || 'Failed to connect to Google Drive');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOneDriveFileSelect = async (fileInfo: OneDriveFileInfo) => {
    setShowOneDriveFilePicker(false);
    try {
      await onOneDriveFileSelected(fileInfo);
    } catch (error) {
      console.error('OneDrive file selection failed:', error);
      setAuthError(error instanceof Error ? error.message : 'Failed to connect to OneDrive');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOneDriveFilePickerCancel = () => {
    setShowOneDriveFilePicker(false);
    setIsConnecting(false);
  };

  const handleOpenLocalFile = async () => {
    setAuthError(null);
    try {
      await onOpenLocalFile();
    } catch (error) {
      console.error('Failed to open local file:', error);
      setAuthError(error instanceof Error ? error.message : 'Failed to open file');
    }
  };

  const handleCreateNewLocalFile = async () => {
    setAuthError(null);
    try {
      await onCreateNewLocalFile();
    } catch (error) {
      console.error('Failed to create new file:', error);
      setAuthError(error instanceof Error ? error.message : 'Failed to create new file');
    }
  };

  return (
    <>
      <Dialog
        open={open && !showOneDriveFilePicker}
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
              <CardActions>
                <Button
                  variant="contained"
                  startIcon={isConnecting ? <CircularProgress size={20} /> : <CloudIcon />}
                  onClick={handleConnectOneDrive}
                  disabled={!isOneDriveConfigured() || isConnecting}
                  fullWidth
                >
                  {isConnecting
                    ? 'Connecting...'
                    : isOneDriveConfigured()
                      ? 'Connect OneDrive'
                      : 'Not Configured'}
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
              <CardActions>
                <Button
                  variant="contained"
                  startIcon={isConnecting ? <CircularProgress size={20} /> : <CloudIcon />}
                  onClick={handleConnectGoogleDrive}
                  disabled={!isGoogleDriveConfigured() || isConnecting}
                  fullWidth
                >
                  {isConnecting
                    ? 'Connecting...'
                    : isGoogleDriveConfigured()
                      ? 'Connect Google Drive'
                      : 'Not Configured'}
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
        onSelect={handleOneDriveFileSelect}
        onCancel={handleOneDriveFilePickerCancel}
        onListFolders={onListOneDriveFolders}
      />
    </>
  );
};
