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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAppStore } from '../../stores/useAppStore';
import { syncService } from '../../services/sync.service';
import { StorageFactory, StorageProviderType } from '../../services/storage/StorageFactory';
import { formatDistance } from 'date-fns';
import { useAccountStore } from '../../stores/useAccountStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAssetStore } from '../../stores/useAssetStore';
import { useBudgetStore } from '../../stores/useBudgetStore';

export const DataSyncSettings: React.FC = () => {
  const navigate = useNavigate();
  const { fileName, lastSaved, hasUnsavedChanges } = useAppStore();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = React.useState(false);

  const getStorageLocation = (): string => {
    const providerType = StorageFactory.getProviderType();
    switch (providerType) {
      case StorageProviderType.LOCAL:
        return 'Local Storage (File System)';
      case StorageProviderType.ONEDRIVE:
        return 'OneDrive';
      case StorageProviderType.GOOGLE_DRIVE:
        return 'Google Drive';
      case StorageProviderType.DROPBOX:
        return 'Dropbox';
      default:
        return 'Unknown';
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

  const handleDisconnect = async () => {
    setDisconnectDialogOpen(false);

    // Reset all data and clear welcome dismissed flag
    await syncService.resetToWelcome();
    localStorage.removeItem('moneyTree.welcomeDismissed');

    // Redirect to dashboard - user will see Welcome dialog
    navigate('/');
    window.location.reload();
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
