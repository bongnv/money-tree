import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { budgetService } from '../../services/budget.service';
import { categoryService } from '../../services/category.service';
import { transactionTypeService } from '../../services/transactionType.service';
import { accountService } from '../../services/account.service';
import { assetService } from '../../services/asset.service';
import { transactionService } from '../../services/transaction.service';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import { useSyncService } from '../../contexts/SyncProvider';
import { formatDistance } from 'date-fns';
import { useAppContext } from '../../contexts/AppContext';
import { db } from '../../db/database';

export const DataSyncSettings: React.FC = () => {
  const navigate = useNavigate();
  const syncService = useSyncService();
  const cloudFileName = syncService.fileName;
  const lastSynced = syncService.lastSynced;
  const { setWelcomeDismissed } = useAppContext();
  const accounts = useLiveQuery(() => accountService.getActive()) ?? [];
  const categories = useLiveQuery(() => categoryService.getActive()) ?? [];
  const transactionTypes = useLiveQuery(() => transactionTypeService.getActive()) ?? [];
  const transactions = useLiveQuery(() => transactionService.getActive()) ?? [];
  const assets = useLiveQuery(() => assetService.getActive()) ?? [];
  const budgets = useLiveQuery(() => budgetService.getActive()) ?? [];

  const [disconnectDialogOpen, setDisconnectDialogOpen] = React.useState(false);

  const fileSize = useMemo(() => {
    // Calculate approximate file size from store data
    // This is a rough estimate - actual file may be larger due to formatting
    try {
      // Only calculate if all data is loaded
      if (
        accounts === undefined ||
        categories === undefined ||
        transactionTypes === undefined ||
        transactions === undefined ||
        budgets === undefined ||
        assets === undefined
      ) {
        return 'Loading...';
      }

      const dataObj = {
        accounts,
        categories,
        transactionTypes,
        transactions,
        budgets,
        manualAssets: assets,
      };

      const jsonStr = JSON.stringify(dataObj);
      const bytes = new Blob([jsonStr]).size;

      let result: string;
      if (bytes < 1024) {
        result = `${bytes} bytes`;
      } else if (bytes < 1024 * 1024) {
        result = `${(bytes / 1024).toFixed(1)} KB`;
      } else {
        result = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      }

      return result;
    } catch (error) {
      console.error('[DataSyncSettings] fileSize error:', error);
      return 'Unknown';
    }
  }, [accounts, categories, transactionTypes, transactions, budgets, assets]);

  const lastModifiedText = useMemo(() => {
    if (!lastSynced) return 'Never';
    try {
      return formatDistance(new Date(lastSynced), new Date(), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  }, [lastSynced]);

  const storageLocation = useMemo(() => {
    return syncService.providerName || 'Not connected';
  }, [syncService.providerName]);

  const handleDisconnect = async () => {
    setDisconnectDialogOpen(false);

    // Clear all data from IndexedDB
    await db.delete();
    await db.open();

    // Disconnect from cloud storage
    await syncService.disconnect();

    // Redirect to dashboard and trigger welcome dialog
    navigate('/');
    setWelcomeDismissed(false);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Current File Info */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current File
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      File Name
                    </Typography>
                    <Typography variant="body1">{cloudFileName || 'No file loaded'}</Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Modified
                    </Typography>
                    <Typography variant="body1">{lastModifiedText}</Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      File Size (approximate)
                    </Typography>
                    <Typography variant="body1">{fileSize}</Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body1">
                      {syncService.providerName || 'Not connected'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Disconnect Section */}
        <Grid size={{ xs: 12 }}>
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
                  {storageLocation}
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
                disabled={!cloudFileName}
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
