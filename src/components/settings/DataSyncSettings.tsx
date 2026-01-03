import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useAppStore } from '../../stores/useAppStore';
import { syncService } from '../../services/sync.service';
import { formatDistance } from 'date-fns';

export const DataSyncSettings: React.FC = () => {
  const navigate = useNavigate();
  const { fileName, lastSaved, hasUnsavedChanges, currentYear } = useAppStore();
  const [switchFileDialogOpen, setSwitchFileDialogOpen] = useState(false);
  const [clearFileDialogOpen, setClearFileDialogOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchFile = async () => {
    setSwitchFileDialogOpen(false);
    setIsSwitching(true);

    try {
      await syncService.switchFile(currentYear);
      // File switched successfully
    } catch (error) {
      console.error('Failed to switch file:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleClearFile = async () => {
    setClearFileDialogOpen(false);

    try {
      await syncService.clearCachedFile();
      // Clear the welcome dismissed flag so user sees the dialog again
      localStorage.removeItem('moneyTree.welcomeDismissed');
      // Redirect to dashboard - user will see Welcome dialog
      navigate('/');
      // Force page reload to trigger welcome dialog
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cached file:', error);
    }
  };

  const getFileSize = (): string => {
    // Calculate approximate file size from store data
    // This is a rough estimate - actual file may be larger due to formatting
    try {
      const accountStore = require('../../stores/useAccountStore').useAccountStore.getState();
      const categoryStore = require('../../stores/useCategoryStore').useCategoryStore.getState();
      const transactionStore = require('../../stores/useTransactionStore').useTransactionStore.getState();
      const assetStore = require('../../stores/useAssetStore').useAssetStore.getState();
      const budgetStore = require('../../stores/useBudgetStore').useBudgetStore.getState();

      const dataObj = {
        accounts: accountStore.accounts,
        categories: categoryStore.categories,
        transactionTypes: categoryStore.transactionTypes,
        transactions: transactionStore.transactions,
        budgets: budgetStore.budgets,
        manualAssets: assetStore.manualAssets,
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

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Data & Sync Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage your data file and sync preferences
      </Typography>

      <Grid container spacing={3}>
        {/* Section 1: Current File */}
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
                    <Typography variant="body1">
                      {fileName || 'No file loaded'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Modified
                    </Typography>
                    <Typography variant="body1">
                      {getLastModifiedText()}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      File Size (approximate)
                    </Typography>
                    <Typography variant="body1">
                      {getFileSize()}
                    </Typography>
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

        {/* Section 2: File Management */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                File Management
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Switch to a different data file or clear the cached file
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      setSwitchFileDialogOpen(true);
                    } else {
                      handleSwitchFile();
                    }
                  }}
                  disabled={isSwitching}
                >
                  Switch File
                </Button>

                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={() => setClearFileDialogOpen(true)}
                  disabled={!fileName}
                >
                  Clear Cached File
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Section 3: Storage Provider */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Storage Provider
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Choose where your data is stored. Cloud providers will be available in future updates.
              </Typography>

              <FormControl fullWidth>
                <InputLabel id="storage-provider-label">Provider</InputLabel>
                <Select
                  labelId="storage-provider-label"
                  id="storage-provider"
                  value="local"
                  label="Provider"
                  disabled
                >
                  <MenuItem value="local">Local File System</MenuItem>
                  <MenuItem value="onedrive" disabled>
                    OneDrive (Coming Soon)
                  </MenuItem>
                  <MenuItem value="googledrive" disabled>
                    Google Drive (Coming Soon)
                  </MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Switch File Dialog */}
      <Dialog open={switchFileDialogOpen} onClose={() => setSwitchFileDialogOpen(false)}>
        <DialogTitle>Switch File</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Switching to a different file will discard these changes.
            Do you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwitchFileDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSwitchFile} color="warning" autoFocus>
            Switch File
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear File Dialog */}
      <Dialog open={clearFileDialogOpen} onClose={() => setClearFileDialogOpen(false)}>
        <DialogTitle>Clear Cached File</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove the cached file reference. The next time you open the app,
            you'll need to select your data file again. The file itself will not be deleted.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 'bold' }}>
            Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearFileDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClearFile} color="warning" autoFocus>
            Clear Cache
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
