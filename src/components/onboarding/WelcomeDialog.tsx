import React, { useState, useCallback } from 'react';
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
import { Cloud as CloudIcon } from '@mui/icons-material';
import { isOneDriveConfigured } from '../../config/onedrive.config';
import { isGoogleDriveConfigured } from '../../config/googledrive.config';
import { useSync } from '@/hooks/useSync';
import { StorageProviderType } from '../../services/storage/StorageProviderFactory';
import { isUserCancellationError } from '../../utils/error.utils';

interface WelcomeDialogProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const syncOps = useSync();

  const [state, setState] = useState({
    isConnecting: false,
    error: null as string | null,
  });

  const handleConnect = useCallback(
    async (provider: StorageProviderType) => {
      setState((s) => ({ ...s, isConnecting: true, error: null }));

      try {
        // Cloud: authenticate (hook will show file picker automatically)
        await syncOps.connect(provider);
        setState((s) => ({ ...s, isConnecting: false }));
        // Close welcome dialog
        onClose();
      } catch (error) {
        setState((s) => ({ ...s, isConnecting: false }));
        if (!isUserCancellationError(error)) {
          setState((s) => ({
            ...s,
            error: error instanceof Error ? error.message : 'Unknown error',
          }));
        }
      }
    },
    [syncOps, onClose]
  );

  return (
    <Dialog open={open} maxWidth="md" fullWidth fullScreen={isMobile} sx={{ zIndex: 1000 }}>
      <DialogTitle>
        <Typography variant="h5" component="div" fontWeight="bold">
          Welcome to Money Tree
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Choose how you&apos;d like to manage your financial data:
        </Typography>

        {state.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {state.error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                startIcon={state.isConnecting ? <CircularProgress size={20} /> : <CloudIcon />}
                onClick={() => handleConnect(StorageProviderType.ONEDRIVE)}
                disabled={!isOneDriveConfigured() || state.isConnecting}
                fullWidth
              >
                {state.isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            </CardActions>
          </Card>

          {/* Connect to Google Drive */}
          {isGoogleDriveConfigured() && (
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <CloudIcon color="primary" fontSize="large" />
                  <Box>
                    <Typography variant="h6" component="div">
                      Connect to Google Drive
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sync your data with Google Drive
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  startIcon={state.isConnecting ? <CircularProgress size={20} /> : <CloudIcon />}
                  onClick={() => handleConnect(StorageProviderType.GOOGLE_DRIVE)}
                  disabled={state.isConnecting}
                  fullWidth
                >
                  {state.isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              </CardActions>
            </Card>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Button onClick={onClose} color="inherit">
          Skip for now
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', flex: 1 }}>
          You can disconnect from this file later in Settings. By using Money Tree, you agree to our{' '}
          <a
            href="/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            Privacy Policy
          </a>
          .
        </Typography>
      </DialogActions>
    </Dialog>
  );
};
