import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
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
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FolderIcon from '@mui/icons-material/Folder';
import { useAppStore } from '../../stores/useAppStore';
import { syncService } from '../../services/sync.service';
import { formatDistance } from 'date-fns';
import { StorageFactory, StorageProviderType } from '../../services/storage/StorageFactory';
import { OneDriveProvider } from '../../services/storage/OneDriveProvider';
import { isOneDriveConfigured } from '../../config/onedrive.config';
import { OneDriveFilePicker, SelectedFileInfo } from '../onedrive/OneDriveFilePicker';

export const DataSyncSettings: React.FC = () => {
  const navigate = useNavigate();
  const { fileName, lastSaved, hasUnsavedChanges, currentYear } = useAppStore();
  const [switchFileDialogOpen, setSwitchFileDialogOpen] = useState(false);
  const [clearFileDialogOpen, setClearFileDialogOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [storageProvider, setStorageProvider] = useState<StorageProviderType>(
    StorageFactory.getProviderType()
  );
  const [isOneDriveAuthenticated, setIsOneDriveAuthenticated] = useState(false);
  const [oneDriveUserEmail, setOneDriveUserEmail] = useState<string | null>(null);
  const [oneDriveFilePath, setOneDriveFilePath] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showFilePicker, setShowFilePicker] = useState(false);

  // Check OneDrive authentication status on mount and provider change
  useEffect(() => {
    const checkOneDriveAuth = async () => {
      if (storageProvider === StorageProviderType.ONEDRIVE) {
        const provider = StorageFactory.getCurrentProvider() as OneDriveProvider;
        await provider.initialize();
        const authenticated = provider.isAuthenticated();
        setIsOneDriveAuthenticated(authenticated);
        if (authenticated) {
          setOneDriveUserEmail(provider.getUserEmail() || null);
          const fileInfo = provider.getSelectedFile();
          setOneDriveFilePath(fileInfo?.filePath || null);
        }
      }
    };
    checkOneDriveAuth();
  }, [storageProvider]);

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
      const transactionStore =
        require('../../stores/useTransactionStore').useTransactionStore.getState();
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

  const handleProviderChange = async (newProvider: StorageProviderType) => {
    if (newProvider === storageProvider) return;

    // If switching to OneDrive and not authenticated, just set provider type
    // User will need to authenticate in the authentication section
    setStorageProvider(newProvider);
    StorageFactory.setProviderType(newProvider);

    // Clear cached file when switching providers
    if (fileName) {
      await syncService.clearCachedFile();
    }
  };

  const handleConnectOneDrive = async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const provider = StorageFactory.getCurrentProvider() as OneDriveProvider;
      await provider.initialize();
      await provider.authenticate();
      setIsOneDriveAuthenticated(true);
      setOneDriveUserEmail(provider.getUserEmail() || null);

      // Try to load existing file from OneDrive
      try {
        await syncService.loadDataFile(currentYear);
      } catch (error) {
        // If no file exists, that's OK - user will start with current data
        console.log('No existing file in OneDrive, continuing with current data');
      }
    } catch (error) {
      console.error('OneDrive authentication failed:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnectOneDrive = async () => {
    try {
      const provider = StorageFactory.getCurrentProvider() as OneDriveProvider;
      provider.disconnect();
      setIsOneDriveAuthenticated(false);
      setOneDriveUserEmail(null);
      setOneDriveFilePath(null);

      // Clear cached file on disconnect
      if (fileName) {
        await syncService.clearCachedFile();
      }
    } catch (error) {
      console.error('OneDrive disconnect failed:', error);
    }
  };

  const handleChangeFileLocation = () => {
    setShowFilePicker(true);
  };

  const handleFileSelect = async (fileInfo: SelectedFileInfo) => {
    setShowFilePicker(false);
    try {
      const provider = StorageFactory.getCurrentProvider() as OneDriveProvider;
      provider.setSelectedFile(fileInfo);
      setOneDriveFilePath(fileInfo.filePath);

      // Optionally load the file if it exists
      if (!fileInfo.isNew) {
        await syncService.loadDataFile(currentYear);
      }
    } catch (error) {
      console.error('Failed to change file location:', error);
      setAuthError(error instanceof Error ? error.message : 'Failed to change file location');
    }
  };

  const handleListOneDriveFolders = async (parentItem?: any) => {
    const provider = StorageFactory.getCurrentProvider() as OneDriveProvider;
    return provider.listFolders(parentItem);
  };

  return (
    <Box>
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
                Choose where your data is stored.
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="storage-provider-label">Provider</InputLabel>
                <Select
                  labelId="storage-provider-label"
                  id="storage-provider"
                  value={storageProvider}
                  label="Provider"
                  onChange={(e) => handleProviderChange(e.target.value as StorageProviderType)}
                >
                  <MenuItem value={StorageProviderType.LOCAL}>Local File System</MenuItem>
                  <MenuItem value={StorageProviderType.ONEDRIVE} disabled={!isOneDriveConfigured()}>
                    OneDrive {!isOneDriveConfigured() && '(Not Configured)'}
                  </MenuItem>
                  <MenuItem value={StorageProviderType.GOOGLE_DRIVE} disabled>
                    Google Drive (Coming Soon)
                  </MenuItem>
                  <MenuItem value={StorageProviderType.DROPBOX} disabled>
                    Dropbox (Coming Soon)
                  </MenuItem>
                </Select>
              </FormControl>

              {/* OneDrive Authentication Section */}
              {storageProvider === StorageProviderType.ONEDRIVE && (
                <Box sx={{ mt: 2 }}>
                  {authError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {authError}
                    </Alert>
                  )}

                  {!isOneDriveAuthenticated ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Connect your OneDrive account to sync your data across devices.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={handleConnectOneDrive}
                        disabled={isAuthenticating}
                        startIcon={isAuthenticating ? <CircularProgress size={20} /> : undefined}
                      >
                        {isAuthenticating ? 'Connecting...' : 'Connect OneDrive'}
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Connected as: {oneDriveUserEmail}
                      </Alert>

                      {/* Show file location */}
                      {oneDriveFilePath && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            File Location:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {oneDriveFilePath}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<FolderIcon />}
                          onClick={handleChangeFileLocation}
                        >
                          Change File Location
                        </Button>
                        <Button
                          variant="outlined"
                          color="warning"
                          onClick={handleDisconnectOneDrive}
                        >
                          Disconnect OneDrive
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Switch File Dialog */}
      <Dialog open={switchFileDialogOpen} onClose={() => setSwitchFileDialogOpen(false)}>
        <DialogTitle>Switch File</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Switching to a different file will discard these changes. Do
            you want to continue?
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
            This will remove the cached file reference. The next time you open the app, you'll need
            to select your data file again. The file itself will not be deleted.
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

      {/* OneDrive File Picker Dialog */}
      <OneDriveFilePicker
        open={showFilePicker}
        onSelect={handleFileSelect}
        onCancel={() => setShowFilePicker(false)}
        onListFolders={handleListOneDriveFolders}
      />
    </Box>
  );
};
