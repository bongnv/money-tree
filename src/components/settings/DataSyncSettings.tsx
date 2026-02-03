import React from 'react';
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
import LogoutIcon from '@mui/icons-material/Logout';
import { useDataSyncSettings } from '@/hooks/useDataSyncSettings';

export const DataSyncSettings: React.FC = () => {
  const {
    cloudFileName,
    fileSize,
    storageLocation,
    status,
    disconnectDialogOpen,
    openDisconnectDialog,
    closeDisconnectDialog,
    handleDisconnect,
  } = useDataSyncSettings();

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
                      File Size (approximate)
                    </Typography>
                    <Typography variant="body1">{fileSize}</Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body1">{status}</Typography>
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
                onClick={openDisconnectDialog}
                disabled={!cloudFileName}
              >
                Disconnect
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Disconnect Dialog */}
      <Dialog open={disconnectDialogOpen} onClose={closeDisconnectDialog}>
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
          <Button onClick={closeDisconnectDialog}>Cancel</Button>
          <Button onClick={handleDisconnect} color="warning" autoFocus>
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
