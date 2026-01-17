import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import BackupIcon from '@mui/icons-material/Backup';
import { useAppStore } from '../../stores/useAppStore';
import {
  useSyncService,
  useBackupService,
  useStorageFactory,
} from '../../contexts/ServiceProviders';
import { formatDistance } from 'date-fns';
import { isUserCancellationError } from '../../utils/error.utils';
import { useAccountStore } from '../../stores/useAccountStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAssetStore } from '../../stores/useAssetStore';
import { useBudgetStore } from '../../stores/useBudgetStore';

export const DataSyncSettings: React.FC = () => {
  const navigate = useNavigate();
  const storageFactory = useStorageFactory();
  const syncService = useSyncService();
  const backupService = useBackupService();
  const {
    fileName,
    lastSaved,
    hasUnsavedChanges,
    lastBackupDate,
    showSnackbar,
    setShouldShowWelcome,
  } = useAppStore();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = React.useState(false);
  const [backupLoading, setBackupLoading] = React.useState(false);

  const getStorageLocation = (): string => {
    try {
      return storageFactory.providerName || 'Not connected';
    } catch {
      return 'Not connected';
    }
  };

  const getFileSize = (): string => {
    // Calculate approximate file size from store data
    // This is a rough estimate - actual file may be larger due to formatting
    try {
      const dataObj = {
        accounts: useAccountStore.getState().accounts,
        categories: useCategoryStore.getState().categories,
        transactionTypes: useCategoryStore.getState().transactionTypes,
        transactions: useTransactionStore.getState().transactions,
        budgets: useBudgetStore.getState().budgets,
        manualAssets: useAssetStore.getState().manualAssets,
      };

      const jsonStr = JSON.stringify(dataObj);
      const bytes = new Blob([jsonStr]).size;

      if (bytes < 1024) return `${bytes} bytes`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch {
      return 'Unknown';
    }
  };

  const getLastModifiedText = (): string => {
    if (!lastSaved) return 'Never';
    try {
      return formatDistance(new Date(lastSaved), new Date(), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getLastBackupText = (): string => {
    if (!lastBackupDate) return 'Never';
    try {
      return formatDistance(new Date(lastBackupDate), new Date(), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const handleCreateBackup = async () => {
    try {
      setBackupLoading(true);

      // Save backup (backs up baseVersion, updates lastBackupDate, sets unsavedChanges)
      await backupService.saveBackupToStorage();

      showSnackbar('Backup saved successfully. Remember to save to update backup date.', 'success');
    } catch (error) {
      if (isUserCancellationError(error)) {
        // User cancelled file picker, don't show error
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Failed to create backup. Please try again.';
      showSnackbar(message, 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnectDialogOpen(false);

    // Reset all data
    await syncService.resetToWelcome();

    // Redirect to dashboard and trigger welcome dialog
    navigate('/');
    setShouldShowWelcome(true);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Current File Info */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current File
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      File Name
                    </Typography>
                    <Typography variant="body1">{fileName || 'No file loaded'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Modified
                    </Typography>
                    <Typography variant="body1">{getLastModifiedText()}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      File Size (approximate)
                    </Typography>
                    <Typography variant="body1">{getFileSize()}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body1">
                      {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Backup Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Backup
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Last Backup
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {getLastBackupText()}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                Create a compressed backup of your data. Backups are saved as ZIP files and can be
                stored locally or on OneDrive.
              </Typography>

              <Typography variant="body2" color="text.secondary" paragraph>
                Note: Backups save the last saved state of your data. Make sure to save any pending
                changes before creating a backup.
              </Typography>

              <Button
                variant="contained"
                color="primary"
                startIcon={backupLoading ? <CircularProgress size={20} /> : <BackupIcon />}
                onClick={handleCreateBackup}
                disabled={backupLoading || !fileName}
              >
                {backupLoading ? 'Creating Backup...' : 'Create Backup'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Disconnect Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Connection
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Storage Location
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {getStorageLocation()}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                Disconnect from the current file and return to the welcome screen to reconnect or
                choose a different file.
              </Typography>

              <Button
                variant="outlined"
                color="warning"
                startIcon={<LogoutIcon />}
                onClick={() => setDisconnectDialogOpen(true)}
                disabled={!fileName}
              >
                Disconnect
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Disconnect Dialog */}
      <Dialog open={disconnectDialogOpen} onClose={() => setDisconnectDialogOpen(false)}>
        <DialogTitle>Disconnect from Current File?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will disconnect you from the current file and return you to the welcome screen.
            You&apos;ll need to reconnect to access your data again.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 'bold' }}>
            Make sure all your changes are saved before disconnecting.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisconnectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDisconnect} color="warning" autoFocus>
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
