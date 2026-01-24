import React, { useMemo } from 'react';
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
import {
  useStorageFactory,
} from '../../contexts/ServiceProviders';
import { formatDistance } from 'date-fns';
import { useAppContext } from '../../contexts/AppContext';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { useCategories } from '../../hooks/queries/useCategories';
import { useTransactionTypes } from '../../hooks/queries/useTransactionTypes';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useAssets } from '../../hooks/queries/useAssets';
import { useBudgets } from '../../hooks/queries/useBudgets';
import { useCloudFileName, useLastSynced } from '../../hooks/queries';
import { db } from '../../db/database';

export const DataSyncSettings: React.FC = () => {
  const navigate = useNavigate();
  const storageFactory = useStorageFactory();
  const cloudFileName = useCloudFileName();
  const lastSynced = useLastSynced();
  const {
    setShouldShowWelcome,
  } = useAppContext();
  const accounts = useAccounts();
  const categories = useCategories();
  const transactionTypes = useTransactionTypes();
  const transactions = useTransactions();
  const assets = useAssets();
  const budgets = useBudgets();

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

      console.log('[DataSyncSettings] fileSize:', result);
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
    try {
      return storageFactory.providerName || 'Not connected';
    } catch {
      return 'Not connected';
    }
  }, [storageFactory.providerName]);

  const handleDisconnect = async () => {
    setDisconnectDialogOpen(false);

    // Clear all data from IndexedDB
    await db.delete();
    await db.open();
    
    // Disconnect from cloud storage
    await storageFactory.disconnect();

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
                    <Typography variant="body1">{cloudFileName || 'No file loaded'}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Modified
                    </Typography>
                    <Typography variant="body1">{lastModifiedText}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      File Size (approximate)
                    </Typography>
                    <Typography variant="body1">{fileSize}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body1">
                      {cloudFileName ? 'Connected' : 'Not connected'}
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
