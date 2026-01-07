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
} from '@mui/material';
import {
  FolderOpen as FolderOpenIcon,
  Cloud as CloudIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { isOneDriveConfigured } from '../../config/onedrive.config';
import { OneDriveFilePicker } from '../onedrive/OneDriveFilePicker';
import type { SelectedFileInfo } from '../../services/storage/OneDriveProvider';

interface WelcomeDialogProps {
  open: boolean;
  onOpenLocalFile: () => void;
  onCreateNewLocalFile: () => void;
  onSelectOneDrive: () => Promise<void>;
  onOneDriveFileSelected: (fileInfo: SelectedFileInfo) => Promise<void>;
  onListOneDriveFolders: (parentItem?: any) => Promise<any[]>;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({
  open,
  onOpenLocalFile,
  onCreateNewLocalFile,
  onSelectOneDrive,
  onOneDriveFileSelected,
  onListOneDriveFolders,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showFilePicker, setShowFilePicker] = useState(false);

  const handleConnectOneDrive = async () => {
    setIsConnecting(true);
    setAuthError(null);

    try {
      await onSelectOneDrive();
      setShowFilePicker(true);
    } catch (error: any) {
      console.error('OneDrive connection failed:', error);
      setAuthError(error.message || 'Failed to connect to OneDrive');
      setIsConnecting(false);
    }
  };

  const handleFileSelect = async (fileInfo: SelectedFileInfo) => {
    setShowFilePicker(false);
    try {
      await onOneDriveFileSelected(fileInfo);
    } catch (error) {
      console.error('OneDrive file selection failed:', error);
      setAuthError(error instanceof Error ? error.message : 'Failed to connect to OneDrive');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFilePickerCancel = () => {
    setShowFilePicker(false);
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
      <Dialog open={open && !showFilePicker} maxWidth="md" fullWidth>
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
                {isOneDriveConfigured() && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      A popup window will open for Microsoft sign-in. If blocked, look for a popup
                      icon in your browser&apos;s address bar and allow it.
                    </Typography>
                  </Alert>
                )}
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
        open={showFilePicker}
        onSelect={handleFileSelect}
        onCancel={handleFilePickerCancel}
        onListFolders={onListOneDriveFolders}
      />
    </>
  );
};
